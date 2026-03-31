// ============================================================
// DreamLove sync orchestration
// Coordinates the 4 feed fetches and upserts into Supabase.
// Idempotent — safe to run multiple times.
// ============================================================

import { createServiceClient } from '@/lib/supabase/server'
import { calculateRetailPrice, charmPrice } from '@/lib/pricing'
import { slugify } from '@/lib/utils'
import {
  fetchCatalog,
  fetchBrands,
  fetchCategories,
} from './feed'
import { getLogisticsFiles } from './soap'
import type { SyncResult } from './types'

const DEFAULT_MARKUP = parseFloat(process.env.DEFAULT_MARKUP_PCT ?? '40')

export interface SyncProgressEvent {
  stage: string
  synced?: number
  total?: number
  message?: string
}

export async function runFullSync(
  onProgress?: (event: SyncProgressEvent) => void,
): Promise<SyncResult> {
  const emit = (event: SyncProgressEvent) => onProgress?.(event)
  const result: SyncResult = { synced: 0, updated: 0, deactivated: 0, errors: [] }
  const supabase = await createServiceClient()

  // 1. Sync shipping methods from DreamLove
  emit({ stage: 'logistics', message: 'Fetching shipping methods...' })
  try {
    const methods = await getLogisticsFiles()
    for (const m of methods) {
      await supabase.from('shipping_methods').upsert(
        {
          dl_code: m.code,
          description: m.description,
          dl_price: m.price,
          free_from: m.freeFrom ?? null,
          countries_csv: m.countriesCsv ?? null,
          synced_at: new Date().toISOString(),
        },
        { onConflict: 'dl_code' },
      )
    }
    emit({ stage: 'logistics', message: `Synced ${methods.length} shipping methods` })
  } catch (err) {
    result.errors.push(`logistics: ${String(err)}`)
    emit({ stage: 'logistics', message: `Error: ${String(err)}` })
  }

  // 2. Sync categories
  emit({ stage: 'categories', message: 'Fetching categories...' })
  try {
    const categories = await fetchCategories()
    for (const cat of categories) {
      const slug = slugify(cat.name) + (cat.id ? '-' + cat.id : '')
      await supabase.from('categories').upsert(
        { dreamlove_id: cat.id, name: cat.name, slug },
        { onConflict: 'dreamlove_id' },
      )
    }
    emit({ stage: 'categories', message: `Synced ${categories.length} categories` })
  } catch (err) {
    result.errors.push(`categories: ${String(err)}`)
    emit({ stage: 'categories', message: `Error: ${String(err)}` })
  }

  // 3. Sync brands
  emit({ stage: 'brands', message: 'Fetching brands...' })
  try {
    const brands = await fetchBrands()
    for (const brand of brands) {
      const slug = slugify(brand.name) + (brand.id ? '-' + brand.id : '')
      await supabase.from('brands').upsert(
        { dreamlove_id: brand.id, name: brand.name, slug },
        { onConflict: 'dreamlove_id' },
      )
    }
    emit({ stage: 'brands', message: `Synced ${brands.length} brands` })
  } catch (err) {
    result.errors.push(`brands: ${String(err)}`)
    emit({ stage: 'brands', message: `Error: ${String(err)}` })
  }

  // 4. Fetch and resolve category/brand FK ids from DB
  // categoryId from feed is the category NAME (e.g. "LOVETOYS|Anal"), map by name
  const { data: dbCategories } = await supabase.from('categories').select('id, name, dreamlove_id')
  const { data: dbBrands } = await supabase.from('brands').select('id, dreamlove_id')

  const categoryMap = new Map(
    (dbCategories ?? []).map((c: { id: string; name: string; dreamlove_id: string }) => [c.name, c.id]),
  )
  const brandMap = new Map(
    (dbBrands ?? []).map((b: { id: string; dreamlove_id: string }) => [b.dreamlove_id, b.id]),
  )

  // 6. Sync catalog products
  emit({ stage: 'catalog', message: 'Fetching catalog XML...' })
  let catalog: Awaited<ReturnType<typeof fetchCatalog>> = []
  try {
    catalog = await fetchCatalog()
    emit({ stage: 'catalog', message: `Loaded ${catalog.length} products, starting upsert...`, total: catalog.length })
  } catch (err) {
    result.errors.push(`catalog: ${String(err)}`)
    emit({ stage: 'catalog', message: `Error: ${String(err)}` })
    return result
  }

  // Fetch existing updated_at_supplier for all products in one query (chunked)
  emit({ stage: 'catalog', message: 'Comparing with DB timestamps...' })
  const existingMap = new Map<string, string>() // dreamlove_id → updated_at_supplier
  const ALL_IDS = catalog.map((p) => p.id)
  const TS_CHUNK = 500
  for (let i = 0; i < ALL_IDS.length; i += TS_CHUNK) {
    const { data } = await supabase
      .from('products')
      .select('dreamlove_id, updated_at_supplier')
      .in('dreamlove_id', ALL_IDS.slice(i, i + TS_CHUNK))
    for (const row of data ?? []) {
      if (row.updated_at_supplier) existingMap.set(row.dreamlove_id, row.updated_at_supplier)
    }
  }

  // Filter: only products new or updated since last sync
  const toSync = catalog.filter((p) => {
    const existing = existingMap.get(p.id)
    if (!existing) return true // new product
    if (!p.updatedAtSupplier) return false
    return new Date(p.updatedAtSupplier) > new Date(existing)
  })

  emit({ stage: 'catalog', message: `${toSync.length} products need update (${catalog.length - toSync.length} unchanged)`, total: toSync.length })

  const syncedIds = new Set<string>(existingMap.keys()) // pre-fill with existing IDs
  const REPORT_EVERY = 500
  const translationQueue: { dreamloveId: string; translations: { lang: string; title?: string; description?: string; htmlDescription?: string }[] }[] = []

  for (const p of toSync) {
    try {
      const supplierPrice = p.supplierPrice
      const retailPrice = charmPrice(calculateRetailPrice(supplierPrice, DEFAULT_MARKUP))
      const slug = slugify(p.name) + '-' + p.id

      const { error } = await supabase.from('products').upsert(
        {
          dreamlove_id: p.id,
          ean: p.ean ?? null,
          name: p.name,
          slug,
          description: p.description ?? null,
          category_id: p.categoryId ? categoryMap.get(p.categoryId) ?? null : null,
          brand_id: p.brandId ? brandMap.get(p.brandId) ?? null : null,
          brand: p.brand ?? null,
          price_ex_vat: p.priceExVat,
          price_with_vat: p.priceWithVat,
          supplier_price: supplierPrice,
          supplier_shipping: p.supplierShipping,
          retail_price: retailPrice,
          markup_pct: DEFAULT_MARKUP,
          stock_quantity: p.stock,
          images: p.images ?? [],
          attributes: p.attributes ?? {},
          weight_grams: p.weight ?? null,
          is_active: p.stock > 0,
          public_id: p.publicId ?? null,
          updated_at_supplier: p.updatedAtSupplier ?? null,
          release_date: p.releaseDate ?? null,
          min_units: p.minUnits,
          max_units: p.maxUnits,
          vat_pct: p.vatPct ?? null,
          is_sale: p.isSale,
          is_new: p.isNew,
          is_refrigerated: p.isRefrigerated,
          width_mm: p.widthMm ?? null,
          height_mm: p.heightMm ?? null,
          depth_mm: p.depthMm ?? null,
          hs_intrastat_code: p.hsIntrastatCode ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'dreamlove_id' },
      )

      if (error) {
        result.errors.push(`product ${p.id}: ${error.message}`)
      } else {
        result.synced++
        syncedIds.add(p.id)

        // Queue translations for batch upsert
        if (p.translations && p.translations.length > 0) {
          translationQueue.push({ dreamloveId: p.id, translations: p.translations })
        }
      }
    } catch (err) {
      result.errors.push(`product ${p.id}: ${String(err)}`)
    }

    if (result.synced % REPORT_EVERY === 0 && result.synced > 0) {
      emit({ stage: 'catalog', synced: result.synced, total: toSync.length })
    }
  }

  emit({ stage: 'catalog', synced: result.synced, total: toSync.length, message: 'Products done' })

  // 7. Batch upsert translations
  emit({ stage: 'translations', message: `Upserting translations for ${translationQueue.length} products...` })
  if (translationQueue.length > 0) {
    // Fetch all product UUIDs by dreamlove_id in chunks (PostgREST URL length limit)
    const dlIds = translationQueue.map((q) => q.dreamloveId)
    const ID_CHUNK = 200
    const allDbProducts: { id: string; dreamlove_id: string }[] = []
    for (let i = 0; i < dlIds.length; i += ID_CHUNK) {
      const { data } = await supabase
        .from('products')
        .select('id, dreamlove_id')
        .in('dreamlove_id', dlIds.slice(i, i + ID_CHUNK))
      if (data) allDbProducts.push(...data)
    }

    const idMap = new Map(allDbProducts.map((p) => [p.dreamlove_id, p.id]))

    // Build flat batch
    const rows = translationQueue.flatMap((q) => {
      const productId = idMap.get(q.dreamloveId)
      if (!productId) return []
      return q.translations.map((t) => ({
        product_id: productId,
        lang: t.lang,
        title: t.title ?? null,
        description: t.description ?? null,
        html_description: t.htmlDescription ?? null,
      }))
    })

    // Upsert in chunks of 50 (html_description can be very large)
    const CHUNK = 50
    let upserted = 0
    let tErrors = 0
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error } = await supabase
        .from('product_translations')
        .upsert(rows.slice(i, i + CHUNK), { onConflict: 'product_id,lang' })
      if (error) {
        tErrors++
      } else {
        upserted += rows.slice(i, i + CHUNK).length
      }
    }
    emit({ stage: 'translations', message: `Done — ${upserted} rows upserted, ${tErrors} chunk errors` })
  }

  // 9. Deactivate products no longer in feed
  emit({ stage: 'deactivate', message: 'Checking for deactivated products...' })
  if (syncedIds.size > 0) {
    const { data: allActive } = await supabase
      .from('products')
      .select('id, dreamlove_id')
      .eq('is_active', true)

    const toDeactivate = (allActive ?? [])
      .filter((p: { id: string; dreamlove_id: string }) => !syncedIds.has(p.dreamlove_id))
      .map((p: { id: string; dreamlove_id: string }) => p.id)

    if (toDeactivate.length > 0) {
      await supabase
        .from('products')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .in('id', toDeactivate)
      result.deactivated = toDeactivate.length
    }
    emit({ stage: 'deactivate', message: `Deactivated ${result.deactivated} products` })
  }

  emit({ stage: 'done', synced: result.synced, message: 'Sync complete' })
  return result
}
