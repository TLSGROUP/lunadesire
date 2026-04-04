// ============================================================
// DreamLove sync — uses REST API (api-dreamlove.gesio.be)
// Replaces XML feed + SOAP approach.
// ============================================================

import { createServiceClient } from '@/lib/supabase/server'
import { calculateRetailPrice, charmPrice } from '@/lib/pricing'
import { slugify } from '@/lib/utils'
import { getProducts, getAvailableStocks, getAllProductCategories, getEnglishCategoryNames, getBrandMaps, fetchTranslationPage, DREAMLOVE_LANG_MAP } from './api'
import type { ApiProduct, ApiProductCategory } from './api'
import type { SyncResult } from './types'

const DEFAULT_MARKUP = parseFloat(process.env.DEFAULT_MARKUP_PCT ?? '40')
const PAGE_SIZE = 500

export interface SyncProgressEvent {
  stage: string
  synced?: number
  total?: number
  message?: string
}

// Extract numeric ID from IRI string e.g. "/product_categories/299" → 299
function iriToId(iri: string | null | undefined): number | null {
  if (!iri) return null
  const m = String(iri).match(/\/(\d+)$/)
  return m ? parseInt(m[1], 10) : null
}

// Build full category path using embedded parent chain + English translations map
// e.g. cat(id=299) → "LOVETOYS|Anal|Anal Plugs"
function buildCategoryPath(
  cat: ApiProductCategory,
  enNames: Map<number, string>,
): string {
  const parts: string[] = []
  let current: ApiProductCategory | null = cat
  while (current) {
    parts.unshift(enNames.get(current.id) ?? current.name ?? String(current.id))
    current = current.parent
  }
  return parts.join('|')
}

// Extract best image URLs from product images array
function extractImages(images: ApiProduct['images']): string[] {
  if (!images || images.length === 0) return []
  // Sort: main first, then by order
  const sorted = [...images].sort((a, b) => {
    if (a.main && !b.main) return -1
    if (!a.main && b.main) return 1
    return (a.order ?? 99) - (b.order ?? 99)
  })
  const urls: string[] = []
  for (const img of sorted) {
    if (!img.image?.files) continue
    // Prefer largest file (type 'big' or highest resolution)
    const files = img.image.files
    const big = files.find((f) => f.type === 'big') ?? files[0]
    if (big?.url) urls.push(big.url)
  }
  return urls
}

// Extract EAN barcode
function extractEan(barcodes: ApiProduct['barcodes']): string | undefined {
  if (!barcodes) return undefined
  const ean = barcodes.find((b) => b.type?.toUpperCase().includes('EAN') || !b.type)
  return ean?.barcode
}

// Extract VAT percentage
function extractVat(product: ApiProduct): number | undefined {
  const rates = product.vatGroup?.vatRates
  if (!rates || rates.length === 0) return undefined
  return parseFloat(rates[0].vatRate?.rate ?? '0') || undefined
}

export async function runFullSync(
  onProgress?: (event: SyncProgressEvent) => void,
): Promise<SyncResult> {
  const emit = (event: SyncProgressEvent) => onProgress?.(event)
  const result: SyncResult = { synced: 0, updated: 0, deactivated: 0, errors: [] }
  const supabase = await createServiceClient()

  // 1. Fetch all products from REST API — first page to get total, then parallel
  emit({ stage: 'catalog', message: 'Fetching products from REST API...' })

  const allProducts: ApiProduct[] = []

  try {
    const first = await getProducts({ page: 1, pageSize: PAGE_SIZE })
    const totalItems: number = first['hydra:totalItems']
    const firstPage = first['hydra:member'] ?? []
    allProducts.push(...firstPage)
    emit({ stage: 'catalog', message: `Total products: ${totalItems}`, total: totalItems, synced: allProducts.length })

    // Use actual returned page size (API may cap lower than PAGE_SIZE)
    const actualPageSize = firstPage.length || PAGE_SIZE
    const totalPages = Math.ceil(totalItems / actualPageSize)

    if (totalPages > 1) {
      const CONCURRENCY = 5
      for (let start = 2; start <= totalPages; start += CONCURRENCY) {
        const pageNums = Array.from(
          { length: Math.min(CONCURRENCY, totalPages - start + 1) },
          (_, i) => start + i
        )
        const results = await Promise.allSettled(
          pageNums.map((p) => getProducts({ page: p, pageSize: PAGE_SIZE }))
        )
        for (const r of results) {
          if (r.status === 'fulfilled') allProducts.push(...(r.value['hydra:member'] ?? []))
          else result.errors.push(`catalog page fetch: ${r.reason}`)
        }
        emit({ stage: 'catalog', message: `Fetched ${allProducts.length} / ${totalItems}`, synced: allProducts.length, total: totalItems })
      }
    }
  } catch (err) {
    result.errors.push(`catalog fetch: ${String(err)}`)
    emit({ stage: 'catalog', message: `Error: ${String(err)}` })
    return result
  }

  emit({ stage: 'catalog', message: `Loaded ${allProducts.length} products` })

  // 2. Fetch all product categories + English translations from REST API
  emit({ stage: 'categories', message: 'Fetching categories from REST API...' })
  let apiCatMap: Map<number, ApiProductCategory>
  let enCatNames: Map<number, string>
  let brandLogoMap: Map<string, string>
  let brandById: Map<number, { name: string; logo: string | null }>
  try {
    const [cats, enNames, brandMaps] = await Promise.all([
      getAllProductCategories(),
      getEnglishCategoryNames(),
      getBrandMaps(),
    ])
    apiCatMap = cats
    enCatNames = enNames
    brandLogoMap = brandMaps.byName
    brandById = brandMaps.byId
    emit({ stage: 'categories', message: `Fetched ${apiCatMap.size} categories, ${enCatNames.size} EN translations, ${brandLogoMap.size} brand logos` })
  } catch (err) {
    result.errors.push(`categories fetch: ${String(err)}`)
    emit({ stage: 'categories', message: `Error fetching categories: ${String(err)}` })
    apiCatMap = new Map()
    enCatNames = new Map()
    brandLogoMap = new Map()
    brandById = new Map()
  }

  // Build set of all unique category paths referenced by products
  // (using embedded parent chain from apiCatMap)
  const categoryPaths = new Set<string>()
  for (const p of allProducts) {
    const rawCat = p.mainCategory ?? p.categories?.[0]
    if (!rawCat) continue
    const id = typeof rawCat === 'string' ? iriToId(rawCat) : rawCat.id
    if (id == null) continue
    const cat = apiCatMap.get(id)
    if (!cat) continue
    // Walk up the parent chain and register every ancestor path
    let current: ApiProductCategory | null = cat
    while (current) {
      const path = buildCategoryPath(current, enCatNames)
      if (path) categoryPaths.add(path)
      current = current.parent
    }
  }

  for (const path of categoryPaths) {
    const slug = slugify(path)
    await supabase.from('categories').upsert(
      { dreamlove_id: path, name: path, slug },
      { onConflict: 'dreamlove_id' },
    )
  }
  emit({ stage: 'categories', message: `Synced ${categoryPaths.size} categories` })

  // 3. Load category map from DB (path → uuid)
  const { data: dbCategories } = await supabase
    .from('categories')
    .select('id, name')
  const categoryDbMap = new Map(
    (dbCategories ?? []).map((c: { id: string; name: string }) => [c.name.toLowerCase(), c.id]),
  )

  // 4. Load existing products timestamps for incremental sync
  emit({ stage: 'catalog', message: 'Comparing timestamps...' })
  const existingMap = new Map<string, string>() // dreamlove_id → updated_at_supplier
  const ALL_IDS = allProducts.map((p) => String(p.id))
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

  // Filter products that need update
  const toSync = allProducts.filter((p) => {
    const existing = existingMap.get(String(p.id))
    if (!existing) return true
    if (!p.updatedAt) return false
    return new Date(p.updatedAt) > new Date(existing)
  })

  emit({ stage: 'catalog', message: `${toSync.length} products to update (${allProducts.length - toSync.length} unchanged)`, total: toSync.length })

  // 5. Upsert products
  const syncedIds = new Set<string>(existingMap.keys())
  const REPORT_EVERY = 200

  for (const p of toSync) {
    try {
      const costPrice = parseFloat(p.costPrice ?? '0') || 0
      const suggestedPrice = parseFloat(p.price ?? '0') || costPrice
      const supplierPrice = suggestedPrice || costPrice
      const retailPrice = charmPrice(calculateRetailPrice(supplierPrice, DEFAULT_MARKUP))

      const slug = slugify(p.name ?? String(p.id)) + '-' + p.id
      const images = extractImages(p.images)
      const ean = extractEan(p.barcodes ?? null)
      const vatPct = extractVat(p)
      const stock = parseInt(p.stock ?? '0', 10) || 0

      // Category: resolve IRI → category object → path → DB UUID
      const rawCat = p.mainCategory ?? p.categories?.[0]
      const catId = rawCat != null ? (typeof rawCat === 'string' ? iriToId(rawCat) : rawCat.id) : null
      const cat = catId != null ? apiCatMap.get(catId) : undefined
      const categoryPath = cat ? buildCategoryPath(cat, enCatNames) : undefined
      const categoryId = categoryPath ? categoryDbMap.get(categoryPath.toLowerCase()) ?? null : null

      // Resolve variant color/size from p.variant (each color/size is a separate product)
      const variantColor = p.variant?.option?.name ?? null
      const variantColorCode = p.variant?.option?.code ?? null
      const variantSize = p.variant?.size?.name ?? null
      const variantSizeCode = p.variant?.size?.code ?? null

      // Build group key: strip variant suffix from name to group siblings together
      // e.g. "LEG AVENUE - BODY ESCOTE ABIERTO VIOLETA" → "leg-avenue-body-escote-abierto"
      let productGroupKey: string | null = null
      if (variantColor || variantSize) {
        let baseName = p.description ?? p.name ?? ''
        if (variantColor) baseName = baseName.replace(new RegExp('\\s*' + variantColor + '\\s*', 'i'), ' ')
        if (variantSize) baseName = baseName.replace(new RegExp('\\s*' + variantSize + '\\s*', 'i'), ' ')
        productGroupKey = slugify(baseName.trim())
      }

      // Resolve brand — API may return either {id, name} object or IRI string "/brands/634"
      let brandName: string | null = null
      let brandLogo: string | null = null
      if (p.brand) {
        if (typeof p.brand === 'string') {
          const brandId = iriToId(p.brand)
          const entry = brandId != null ? brandById.get(brandId) : undefined
          brandName = entry?.name ?? null
          brandLogo = entry?.logo ?? null
        } else {
          brandName = p.brand.name ?? null
          brandLogo = brandName
            ? (brandLogoMap.get(brandName.toLowerCase()) ??
               [...brandLogoMap.entries()].find(([key]) => brandName!.toLowerCase().includes(key))?.[1] ??
               null)
            : null
        }
      }

      const { error } = await supabase.from('products').upsert(
        {
          dreamlove_id: String(p.id),
          ean: ean ?? null,
          name: p.description ?? p.name ?? '',
          slug,
          description: p.longDescription ?? p.description ?? null,
          category_id: categoryId,
          brand: brandName,
          brand_logo: brandLogo,
          supplier_price: supplierPrice,
          price_ex_vat: costPrice,
          price_with_vat: supplierPrice,
          supplier_shipping: 0,
          retail_price: retailPrice,
          markup_pct: DEFAULT_MARKUP,
          stock_quantity: stock,
          images,
          attributes: {},
          variant_color: variantColor,
          variant_color_code: variantColorCode,
          variant_size: variantSize,
          variant_size_code: variantSizeCode,
          product_group_key: productGroupKey,
          weight_grams: p.weight ? Math.round(parseFloat(p.weight) * 1000) : null,
          is_active: p.active && stock > 0,
          is_new: p.new ?? false,
          is_sale: p.reducedPrice ?? false,
          is_refrigerated: p.requiresRefrigeration ?? false,
          width_mm: p.width ? Math.round(parseFloat(p.width)) : null,
          height_mm: p.height ? Math.round(parseFloat(p.height)) : null,
          depth_mm: p.length ? Math.round(parseFloat(p.length)) : null,
          vat_pct: vatPct ?? null,
          public_id: p.sku ?? null,
          updated_at_supplier: p.updatedAt,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'dreamlove_id' },
      )

      if (error) {
        result.errors.push(`product ${p.id}: ${error.message}`)
      } else {
        result.synced++
        syncedIds.add(String(p.id))
      }
    } catch (err) {
      result.errors.push(`product ${p.id}: ${String(err)}`)
    }

    if (result.synced % REPORT_EVERY === 0 && result.synced > 0) {
      emit({ stage: 'catalog', synced: result.synced, total: toSync.length })
    }
  }

  emit({ stage: 'catalog', synced: result.synced, total: toSync.length, message: 'Products done' })

  // 5b. Batch-update category_id for ALL products (not just changed ones)
  // Group by category_id → list of dreamlove product IDs
  emit({ stage: 'categories', message: 'Updating category assignments for all products...' })
  const catToDlIds = new Map<string, string[]>()
  for (const p of allProducts) {
    const rawCat = p.mainCategory ?? p.categories?.[0]
    const catId = rawCat != null ? (typeof rawCat === 'string' ? iriToId(rawCat) : rawCat.id) : null
    const cat = catId != null ? apiCatMap.get(catId) : undefined
    const categoryPath = cat ? buildCategoryPath(cat, enCatNames) : undefined
    const categoryUuid = categoryPath ? categoryDbMap.get(categoryPath.toLowerCase()) ?? null : null
    if (categoryUuid) {
      if (!catToDlIds.has(categoryUuid)) catToDlIds.set(categoryUuid, [])
      catToDlIds.get(categoryUuid)!.push(String(p.id))
    }
  }
  const CAT_BATCH = 500
  for (const [categoryUuid, dlIds] of catToDlIds) {
    for (let i = 0; i < dlIds.length; i += CAT_BATCH) {
      await supabase
        .from('products')
        .update({ category_id: categoryUuid })
        .in('dreamlove_id', dlIds.slice(i, i + CAT_BATCH))
    }
  }
  emit({ stage: 'categories', message: `Category assignments updated for ${allProducts.length} products` })

  // 5c. Batch-update brand_logo for ALL products
  emit({ stage: 'catalog', message: 'Updating brand logos for all products...' })
  const brandToDlIds = new Map<string, string[]>() // logoUrl → dreamlove IDs
  for (const p of allProducts) {
    if (!p.brand) continue
    let logo: string | null | undefined
    if (typeof p.brand === 'string') {
      const brandId = iriToId(p.brand)
      logo = brandId != null ? brandById.get(brandId)?.logo : undefined
    } else {
      const name = p.brand.name?.toLowerCase()
      if (!name) continue
      logo = brandLogoMap.get(name) ??
        [...brandLogoMap.entries()].find(([key]) => name.includes(key))?.[1]
    }
    if (!logo) continue
    if (!brandToDlIds.has(logo)) brandToDlIds.set(logo, [])
    brandToDlIds.get(logo)!.push(String(p.id))
  }
  const BRAND_BATCH = 500
  for (const [logoUrl, dlIds] of brandToDlIds) {
    for (let i = 0; i < dlIds.length; i += BRAND_BATCH) {
      await supabase
        .from('products')
        .update({ brand_logo: logoUrl })
        .in('dreamlove_id', dlIds.slice(i, i + BRAND_BATCH))
    }
  }
  emit({ stage: 'catalog', message: `Brand logos updated for ${[...brandToDlIds.values()].flat().length} products` })

  // 5d. Fetch and upsert product translations — language by language, page by page
  emit({ stage: 'translations', message: 'Loading product ID map...' })
  const { data: dbProducts } = await supabase.from('products').select('id, dreamlove_id')
  const dlToUuid = new Map<string, string>(
    (dbProducts ?? []).map((p: { id: string; dreamlove_id: string }) => [p.dreamlove_id, p.id])
  )

  const langEntries = Object.entries(DREAMLOVE_LANG_MAP)
  let totalTransSaved = 0

  // Helper: fetch all translation pages for one language with parallel page fetching
  async function fetchLangTranslations(langId: string, locale: string) {
    const byProduct = new Map<string, { name: string | null; description: string | null; long_description: string | null }>()

    function mergeRecords(records: { field: string; value: string | null; product: string }[]) {
      for (const t of records) {
        if (!['name', 'description', 'longDescription'].includes(t.field)) continue
        if (!t.value) continue
        const dlId = String(t.product).match(/\/(\d+)$/)?.[1]
        if (!dlId) continue
        const uuid = dlToUuid.get(dlId)
        if (!uuid) continue
        if (!byProduct.has(uuid)) byProduct.set(uuid, { name: null, description: null, long_description: null })
        const entry = byProduct.get(uuid)!
        if (t.field === 'name') entry.name = t.value
        else if (t.field === 'description') entry.description = t.value
        else if (t.field === 'longDescription') entry.long_description = t.value
      }
    }

    // Fetch first page to get total and actual page size
    const first = await fetchTranslationPage(langId, 1)
    mergeRecords(first.records)
    const actualPageSize = first.records.length || 30
    const totalItems = first.totalItems ?? 0
    const totalPages = totalItems > 0 ? Math.ceil(totalItems / actualPageSize) : (first.hasNext ? 9999 : 1)

    emit({ stage: 'translations', message: `[${locale.toUpperCase()}] ${totalItems} records, ~${totalPages} pages` })

    if (totalPages > 1) {
      const TRANS_CONCURRENCY = 10
      for (let start = 2; start <= totalPages; start += TRANS_CONCURRENCY) {
        const pageNums = Array.from(
          { length: Math.min(TRANS_CONCURRENCY, totalPages - start + 1) },
          (_, i) => start + i
        )
        const results = await Promise.allSettled(
          pageNums.map((p) => fetchTranslationPage(langId, p))
        )
        for (const r of results) {
          if (r.status === 'fulfilled') mergeRecords(r.value.records)
          else result.errors.push(`translations [${locale}] page: ${r.reason}`)
        }
        const fetched = Math.min(start + TRANS_CONCURRENCY - 2, totalPages)
        if (fetched % 50 === 0 || fetched === totalPages) {
          emit({ stage: 'translations', message: `[${locale.toUpperCase()}] fetched ${fetched}/${totalPages} pages` })
        }
      }
    }

    // Batch upsert all accumulated records
    const rows = [...byProduct.entries()].map(([product_id, fields]) => ({ product_id, locale, ...fields }))
    emit({ stage: 'translations', message: `[${locale.toUpperCase()}] saving ${rows.length} translations…` })

    const TRANS_BATCH = 1000
    for (let i = 0; i < rows.length; i += TRANS_BATCH) {
      const { error } = await supabase
        .from('product_translations')
        .upsert(rows.slice(i, i + TRANS_BATCH), { onConflict: 'product_id,locale' })
      if (error) result.errors.push(`translations [${locale}] batch ${i}: ${error.message}`)
    }

    return rows.length
  }

  // Fetch all 8 languages in parallel (2 at a time to avoid API rate limits)
  const LANG_CONCURRENCY = 2
  for (let i = 0; i < langEntries.length; i += LANG_CONCURRENCY) {
    const batch = langEntries.slice(i, i + LANG_CONCURRENCY)
    const results = await Promise.allSettled(
      batch.map(([langId, locale]) => fetchLangTranslations(langId, locale))
    )
    for (let j = 0; j < results.length; j++) {
      const r = results[j]
      const locale = batch[j][1]
      if (r.status === 'fulfilled') {
        totalTransSaved += r.value
        emit({ stage: 'translations', message: `[${locale.toUpperCase()}] done — ${r.value} saved`, synced: totalTransSaved })
      } else {
        result.errors.push(`translations [${locale}]: ${r.reason}`)
        emit({ stage: 'translations', message: `[${locale.toUpperCase()}] error: ${r.reason}` })
      }
    }
  }

  // 5e. Populate Spanish translations from base product fields (DreamLove is natively Spanish)
  emit({ stage: 'translations', message: '[ES] Generating from base product data…' })
  const esRows: { product_id: string; locale: string; name: string | null; description: string | null; long_description: string | null }[] = []
  for (const p of allProducts) {
    const uuid = dlToUuid.get(String(p.id))
    if (!uuid) continue
    esRows.push({
      product_id: uuid,
      locale: 'es',
      name: p.description ?? p.name ?? null,
      description: p.longDescription ?? p.description ?? null,
      long_description: p.longDescription ?? null,
    })
  }
  const ES_BATCH = 1000
  for (let i = 0; i < esRows.length; i += ES_BATCH) {
    const { error } = await supabase
      .from('product_translations')
      .upsert(esRows.slice(i, i + ES_BATCH), { onConflict: 'product_id,locale' })
    if (error) result.errors.push(`translations [es] base: ${error.message}`)
  }
  totalTransSaved += esRows.length
  emit({ stage: 'translations', message: `[ES] done — ${esRows.length} from base data`, synced: totalTransSaved })

  emit({ stage: 'translations', message: `Translations done — ${totalTransSaved} records saved`, synced: totalTransSaved })

  // 6. Deactivate products no longer in feed
  emit({ stage: 'deactivate', message: 'Checking for removed products...' })
  if (syncedIds.size > 0) {
    const { data: allActive } = await supabase
      .from('products')
      .select('id, dreamlove_id')
      .eq('is_active', true)

    const toDeactivate = (allActive ?? [])
      .filter((p: { id: string; dreamlove_id: string }) => !syncedIds.has(p.dreamlove_id))
      .map((p: { id: string }) => p.id)

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

// ---- Stock sync (lightweight — only updates stock_quantity) ----

export async function syncStocks(
  onProgress?: (event: SyncProgressEvent) => void,
): Promise<{ updated: number; errors: string[] }> {
  const emit = (event: SyncProgressEvent) => onProgress?.(event)
  const supabase = await createServiceClient()
  let updated = 0
  const errors: string[] = []

  emit({ stage: 'stock', message: 'Fetching stock updates...' })

  let page = 1
  while (true) {
    try {
      const res = await getAvailableStocks({ page, pageSize: PAGE_SIZE } as Parameters<typeof getAvailableStocks>[0] & { pageSize?: number })
      const stocks = res['hydra:member']
      if (!stocks || stocks.length === 0) break

      for (const s of stocks) {
        const dreamloveId = String(s.product.id)
        const { error } = await supabase
          .from('products')
          .update({
            stock_quantity: s.available,
            is_active: s.available > 0,
            updated_at: new Date().toISOString(),
          })
          .eq('dreamlove_id', dreamloveId)

        if (error) errors.push(`stock ${dreamloveId}: ${error.message}`)
        else updated++
      }

      emit({ stage: 'stock', synced: updated, message: `Updated ${updated} stocks` })
      if (!res['hydra:view']?.['hydra:next']) break
      page++
    } catch (err) {
      errors.push(`stock page ${page}: ${String(err)}`)
      break
    }
  }

  emit({ stage: 'stock', synced: updated, message: `Stock sync done — ${updated} updated` })
  return { updated, errors }
}
