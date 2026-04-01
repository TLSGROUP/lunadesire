// ============================================================
// DreamLove feed parsers — field names verified against live feeds
//
// Feed structures:
//   CATALOG  XML  — doc.catalog.product[]
//     fields: id, title(CDATA), description(CDATA), html_description(CDATA),
//             cost_price, available, brand(CDATA), shipping_weight,
//             barcodes.barcode[]{@_type, #text},
//             stock.location[]{@_path, #text},
//             images.image[]{@_preferred, src},
//             categories.category[]{@_gesioid, @_ref, #text}
//
//   BRANDS   TSV  — columns: Nombre, Descripción, URL  (no numeric ID)
//
//   CATEGORIES CSV — columns: product_id, sku, category_01…category_50
//                    (product→category mapping; extract unique names)
//
//   PRICES   CSV  — mercamania format (may return auth error; non-fatal)
// ============================================================

import { XMLParser } from 'fast-xml-parser'
import type {
  DreamLoveProduct,
  DreamLoveCategory,
  DreamLoveBrand,
  DreamLovePriceEntry,
  DreamLoveTranslation,
} from './types'

// ---- Catalog XML -----------------------------------------------

export async function fetchCatalog(): Promise<DreamLoveProduct[]> {
  const baseUrl = process.env.DREAMLOVE_CATALOG_URL!
  const token = process.env.DREAMLOVE_TOKEN
  const url = token ? `${baseUrl}?tkn=${token}` : baseUrl
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Catalog fetch failed: ${res.status}`)
  const xml = await res.text()
  return parseCatalogXml(xml)
}

function parseCatalogXml(xml: string): DreamLoveProduct[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    parseAttributeValue: true,
    isArray: (tagName) =>
      ['product', 'image', 'barcode', 'category', 'location', 'value'].includes(tagName),
  })
  const doc = parser.parse(xml)

  const rawItems: unknown[] = doc?.catalog?.product ?? []

  return rawItems
    .map((item: unknown): DreamLoveProduct | null => {
      const i = item as Record<string, unknown>

      const id = String(i.id ?? '').trim()
      if (!id) return null

      // title is CDATA — no attributes so value is a plain string
      const name = String(i.title ?? '').trim()
      if (!name) return null

      // Prefer html_description; fall back to description
      const rawHtml = i.html_description
      const rawDesc = i.description
      const description =
        typeof rawHtml === 'string' && rawHtml.trim()
          ? rawHtml.trim()
          : typeof rawDesc === 'string' && rawDesc.trim()
          ? rawDesc.trim()
          : undefined

      const priceExVat   = parseFloat(String(i.cost_price ?? 0)) || 0
      const priceWithVat = parseFloat(String(i.price_with_taxes ?? i.price ?? 0)) || priceExVat
      const supplierShipping = parseFloat(String(i.default_shipping_cost ?? 0)) || 0
      // Use price_with_taxes as the base cost (worst case — EU orders include VAT)
      const supplierPrice = priceWithVat

      // <stock><location path="General">50</location></stock>
      // With isArray('location'), location is always an array.
      // With attributes + text: { '@_path': 'General', '#text': 50 }
      let stock = 0
      const stockObj = i.stock as Record<string, unknown> | undefined
      const locations = stockObj?.location
      if (Array.isArray(locations) && locations.length > 0) {
        const loc = locations[0] as Record<string, unknown>
        const val = loc['#text'] ?? loc
        stock = typeof val === 'number' ? val : parseInt(String(val), 10) || 0
      }

      // <brand><![CDATA[BATHMATE]]></brand>  →  brand: 'BATHMATE'
      const brand =
        typeof i.brand === 'string' && i.brand.trim() ? i.brand.trim() : undefined
      const brandId = brand // no numeric brand ID in feed — use name as key

      // <barcodes><barcode type="EAN-13"><![CDATA[...]]></barcode></barcodes>
      // With attrs+CDATA: { '@_type': 'EAN-13', '#text': '...' }
      let ean: string | undefined
      const barcodesObj = i.barcodes as Record<string, unknown> | undefined
      const barcodeArr = barcodesObj?.barcode
      if (Array.isArray(barcodeArr)) {
        for (const bc of barcodeArr) {
          const b = bc as Record<string, unknown>
          if (b['@_type'] === 'EAN-13') {
            const val = b['#text']
            if (val != null) {
              ean = String(val)
              break
            }
          }
        }
      }

      // <categories><category gesioid="2" ref="lovetoys"><![CDATA[LOVETOYS]]></category></categories>
      // With attrs+CDATA: { '@_gesioid': 2, '@_ref': '...', '#text': 'LOVETOYS' }
      let categoryId: string | undefined
      const categoriesObj = i.categories as Record<string, unknown> | undefined
      const categoryArr = categoriesObj?.category
      if (Array.isArray(categoryArr) && categoryArr.length > 0) {
        // Prefer maincategory="1" — fallback to deepest (most pipes)
        let mainCat: string | undefined
        const allNames: string[] = []
        for (const c of categoryArr) {
          const cat = c as Record<string, unknown>
          const text = cat['#text'] != null ? String(cat['#text']).trim() : null
          if (!text) continue
          allNames.push(text)
          if (cat['@_maincategory'] === 1 || cat['@_maincategory'] === '1') {
            mainCat = text
          }
        }
        if (mainCat) {
          categoryId = mainCat
        } else {
          allNames.sort((a, b) => b.split('|').length - a.split('|').length)
          categoryId = allNames[0]
        }
      }

      // <images><image preferred="1"><src>URL</src></image></images>
      // Sort preferred=1 first, then collect src values
      const images: string[] = []
      const imagesObj = i.images as Record<string, unknown> | undefined
      const imageArr = imagesObj?.image
      if (Array.isArray(imageArr)) {
        const sorted = [...imageArr].sort((a: unknown, b: unknown) => {
          const ap = (a as Record<string, unknown>)['@_preferred']
          const bp = (b as Record<string, unknown>)['@_preferred']
          const aScore = ap === 1 || ap === '1' ? 1 : 0
          const bScore = bp === 1 || bp === '1' ? 1 : 0
          return bScore - aScore
        })
        for (const img of sorted) {
          const src = (img as Record<string, unknown>).src
          if (typeof src === 'string' && src.trim()) images.push(src.trim())
        }
      }

      const weight =
        i.shipping_weight != null
          ? parseInt(String((i.shipping_weight as Record<string, unknown>)?.['#text'] ?? i.shipping_weight), 10) || undefined
          : undefined

      const publicId = typeof i.public_id === 'string' ? i.public_id.trim() : undefined
      const updatedAtSupplier = typeof i.updated === 'string' ? i.updated.trim() : undefined
      const releaseDate = typeof i.release_date === 'string' ? i.release_date.trim() : undefined
      const minUnits = parseInt(String(i.min_units_per_order ?? 1), 10) || 1
      const maxUnits = parseInt(String(i.max_units_per_order ?? 999), 10) || 999
      const vatPct = i.vat != null ? parseFloat(String(i.vat)) || undefined : undefined

      // <sale value="0"/> <new value="0"/>
      const saleVal = (i.sale as Record<string, unknown> | undefined)?.['@_value']
      const newVal = (i.new as Record<string, unknown> | undefined)?.['@_value']
      const isSale = saleVal === 1 || saleVal === '1'
      const isNew = newVal === 1 || newVal === '1'

      // <refrigerated value="0"/>
      const refrigVal = (i.refrigerated as Record<string, unknown> | undefined)?.['@_value']
      const isRefrigerated = refrigVal === 1 || refrigVal === '1'

      // <size unit="mm"><width>96</width><height>306</height><depth>93</depth></size>
      const sizeObj = i.size as Record<string, unknown> | undefined
      const widthMm = sizeObj?.width != null ? parseInt(String(sizeObj.width), 10) || undefined : undefined
      const heightMm = sizeObj?.height != null ? parseInt(String(sizeObj.height), 10) || undefined : undefined
      const depthMm = sizeObj?.depth != null ? parseInt(String(sizeObj.depth), 10) || undefined : undefined

      const hsIntrastatCode = typeof i.hs_intrastat_code === 'string' && i.hs_intrastat_code.trim()
        ? i.hs_intrastat_code.trim()
        : undefined

      // <internationalization><title><value lang="en-UK">...</value>...
      const translations: DreamLoveTranslation[] = []
      const intl = i.internationalization as Record<string, unknown> | undefined
      if (intl) {
        const langMap = new Map<string, DreamLoveTranslation>()

        const extractIntlField = (fieldName: string, setter: (t: DreamLoveTranslation, v: string) => void) => {
          const field = (intl[fieldName] as Record<string, unknown> | undefined)?.value
          if (Array.isArray(field)) {
            for (const v of field) {
              const val = v as Record<string, unknown>
              const lang = String(val['@_lang'] ?? '')
              const text = String(val['#text'] ?? '').trim()
              if (!lang || !text) continue
              if (!langMap.has(lang)) langMap.set(lang, { lang })
              setter(langMap.get(lang)!, text)
            }
          }
        }

        extractIntlField('title', (t, v) => { t.title = v })
        extractIntlField('description', (t, v) => { t.description = v })
        extractIntlField('html_description', (t, v) => { t.htmlDescription = v })

        translations.push(...langMap.values())
      }

      return {
        id,
        ean,
        name,
        description,
        brand,
        brandId,
        categoryId,
        priceExVat,
        priceWithVat,
        supplierPrice,
        supplierShipping,
        stock,
        images,
        weight,
        attributes: {},
        translations,
        publicId,
        updatedAtSupplier,
        releaseDate,
        minUnits,
        maxUnits,
        vatPct,
        isSale,
        isNew,
        isRefrigerated,
        widthMm,
        heightMm,
        depthMm,
        hsIntrastatCode,
      }
    })
    .filter((p): p is DreamLoveProduct => p !== null)
}

// ---- Prices CSV ------------------------------------------------
// mercamania format — may return an auth error; callers handle failure gracefully

export async function fetchPrices(): Promise<Map<string, number>> {
  const url = process.env.DREAMLOVE_PRICES_URL!
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Prices fetch failed: ${res.status}`)
  const text = await res.text()
  return parsePricesCsv(text)
}

function parsePricesCsv(csv: string): Map<string, number> {
  const map = new Map<string, number>()
  const lines = csv.split('\n')
  if (lines.length < 2) return map

  const sep = lines[0].includes(';') ? ';' : ','
  const headers = lines[0].split(sep).map((h) => h.trim().replace(/"/g, ''))

  const idIdx = findColIndex(headers, ['id', 'product_id', 'productid', 'item_id', 'codigo'])
  const priceIdx = findColIndex(headers, ['price', 'precio', 'pvp', 'cost', 'supplier_price'])

  if (idIdx < 0 || priceIdx < 0) return map

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cols = line.split(sep).map((c) => c.replace(/"/g, '').trim())
    const id = cols[idIdx]
    const price = parseFloat(cols[priceIdx])
    if (id && !isNaN(price)) map.set(id, price)
  }

  return map
}

// ---- Brands TSV ------------------------------------------------
// Columns: Nombre (tab) Descripción (tab) URL
// No numeric ID — brand name is used as the unique key

export async function fetchBrands(): Promise<DreamLoveBrand[]> {
  const url = process.env.DREAMLOVE_BRANDS_URL!
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Brands fetch failed: ${res.status}`)
  const text = await res.text()
  return parseBrandsCsv(text)
}

function parseBrandsCsv(csv: string): DreamLoveBrand[] {
  const brands: DreamLoveBrand[] = []
  const lines = csv.split('\n')
  if (lines.length < 2) return brands

  // Tab-separated
  const headers = lines[0].split('\t').map((h) => h.trim())
  const nameIdx = findColIndex(headers, ['nombre', 'name', 'brand', 'marca'])
  if (nameIdx < 0) return brands

  const seen = new Set<string>()
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cols = line.split('\t')
    const name = cols[nameIdx]?.trim()
    if (!name || seen.has(name)) continue
    seen.add(name)
    brands.push({ id: name, name }) // name as ID — no numeric brand ID in feed
  }

  return brands
}

// ---- Categories CSV --------------------------------------------
// Columns: product_id; sku; category_01; category_02; … category_50
// This is a product→category mapping — we extract unique category names

export async function fetchCategories(): Promise<DreamLoveCategory[]> {
  const url = process.env.DREAMLOVE_CATEGORIES_URL!
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Categories fetch failed: ${res.status}`)
  const text = await res.text()
  return parseCategoriesCsv(text)
}

function parseCategoriesCsv(csv: string): DreamLoveCategory[] {
  const lines = csv.split('\n')
  if (lines.length < 2) return []

  const sep = ';'
  // Strip BOM and quotes from headers
  const headers = lines[0]
    .split(sep)
    .map((h) => h.trim().replace(/"/g, '').replace(/^\uFEFF/, ''))

  // Collect indices of all category_XX columns
  const catIndices: number[] = []
  headers.forEach((h, idx) => {
    if (/^category_\d+$/i.test(h)) catIndices.push(idx)
  })

  if (catIndices.length === 0) return []

  const seen = new Set<string>()
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cols = line.split(sep).map((c) => c.trim().replace(/"/g, ''))
    for (const idx of catIndices) {
      const name = cols[idx]?.trim()
      if (name) seen.add(name)
    }
  }

  // Return unique categories — name used as ID (no numeric IDs in this feed)
  return Array.from(seen).map((name) => ({ id: name, name }))
}

// ---- Helpers ---------------------------------------------------

function findColIndex(headers: string[], candidates: string[]): number {
  const lower = headers.map((h) => h.toLowerCase())
  for (const c of candidates) {
    const idx = lower.indexOf(c.toLowerCase())
    if (idx >= 0) return idx
  }
  return -1
}

export type { DreamLoveProduct, DreamLoveCategory, DreamLoveBrand, DreamLovePriceEntry }
