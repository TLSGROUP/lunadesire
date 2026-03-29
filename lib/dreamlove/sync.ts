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
  fetchPrices,
  fetchBrands,
  fetchCategories,
} from './feed'
import { getLogisticsFiles } from './soap'
import type { SyncResult } from './types'

const DEFAULT_MARKUP = parseFloat(process.env.DEFAULT_MARKUP_PCT ?? '40')

export async function runFullSync(): Promise<SyncResult> {
  const result: SyncResult = { synced: 0, updated: 0, deactivated: 0, errors: [] }
  const supabase = await createServiceClient()

  // 1. Sync shipping methods from DreamLove
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
  } catch (err) {
    result.errors.push(`logistics: ${String(err)}`)
  }

  // 2. Sync categories
  try {
    const categories = await fetchCategories()
    for (const cat of categories) {
      const slug = slugify(cat.name) + (cat.id ? '-' + cat.id : '')
      await supabase.from('categories').upsert(
        {
          dreamlove_id: cat.id,
          name: cat.name,
          slug,
          // parent_id resolved in a second pass if needed
        },
        { onConflict: 'dreamlove_id' },
      )
    }
  } catch (err) {
    result.errors.push(`categories: ${String(err)}`)
  }

  // 3. Sync brands
  try {
    const brands = await fetchBrands()
    for (const brand of brands) {
      const slug = slugify(brand.name) + (brand.id ? '-' + brand.id : '')
      await supabase.from('brands').upsert(
        { dreamlove_id: brand.id, name: brand.name, slug },
        { onConflict: 'dreamlove_id' },
      )
    }
  } catch (err) {
    result.errors.push(`brands: ${String(err)}`)
  }

  // 4. Fetch prices map (id → price) for merging
  let priceMap = new Map<string, number>()
  try {
    priceMap = await fetchPrices()
  } catch (err) {
    result.errors.push(`prices: ${String(err)}`)
  }

  // 5. Fetch and resolve category/brand FK ids from DB
  const { data: dbCategories } = await supabase
    .from('categories')
    .select('id, dreamlove_id')
  const { data: dbBrands } = await supabase
    .from('brands')
    .select('id, dreamlove_id')

  const categoryMap = new Map(
    (dbCategories ?? []).map((c: { id: string; dreamlove_id: string }) => [c.dreamlove_id, c.id]),
  )
  const brandMap = new Map(
    (dbBrands ?? []).map((b: { id: string; dreamlove_id: string }) => [b.dreamlove_id, b.id]),
  )

  // 6. Sync catalog products
  let catalog: Awaited<ReturnType<typeof fetchCatalog>> = []
  try {
    catalog = await fetchCatalog()
  } catch (err) {
    result.errors.push(`catalog: ${String(err)}`)
    return result
  }

  const syncedIds = new Set<string>()

  for (const p of catalog) {
    try {
      // Merge price from prices feed if available
      const supplierPrice = priceMap.get(p.id) ?? p.supplierPrice
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
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'dreamlove_id' },
      )

      if (error) {
        result.errors.push(`product ${p.id}: ${error.message}`)
      } else {
        result.synced++
        syncedIds.add(p.id)
      }
    } catch (err) {
      result.errors.push(`product ${p.id}: ${String(err)}`)
    }
  }

  // 7. Deactivate products no longer in feed
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
  }

  return result
}
