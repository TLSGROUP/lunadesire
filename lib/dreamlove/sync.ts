// ============================================================
// DreamLove sync — uses REST API (api-dreamlove.gesio.be)
// Replaces XML feed + SOAP approach.
// ============================================================

import { createServiceClient } from '@/lib/supabase/server'
import { calculateRetailPrice, charmPrice } from '@/lib/pricing'
import { slugify } from '@/lib/utils'
import { getProducts, getAvailableStocks, getAllProductCategories, getEnglishCategoryNames, getBrandMaps } from './api'
import type { ApiProduct, ApiProductCategory } from './api'
import type { SyncResult } from './types'

const DEFAULT_MARKUP = parseFloat(process.env.DEFAULT_MARKUP_PCT ?? '40')
const PAGE_SIZE = 100

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

  // 1. Fetch all products from REST API (paginated)
  emit({ stage: 'catalog', message: 'Fetching products from REST API...' })

  const allProducts: ApiProduct[] = []
  let page = 1
  let totalItems = 0

  try {
    while (true) {
      const res = await getProducts({ page, pageSize: PAGE_SIZE })
      if (page === 1) {
        totalItems = res['hydra:totalItems']
        emit({ stage: 'catalog', message: `Total products: ${totalItems}`, total: totalItems })
      }
      const members = res['hydra:member']
      if (!members || members.length === 0) break
      allProducts.push(...members)
      emit({ stage: 'catalog', message: `Fetched ${allProducts.length} / ${totalItems}`, synced: allProducts.length, total: totalItems })
      if (!res['hydra:view']?.['hydra:next']) break
      page++
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
