// ============================================================
// DreamLove REST API client
// Base: https://api-dreamlove.gesio.be
// Auth: Basic base64(username:password) in Authorization header
// ============================================================

const API_BASE = process.env.DREAMLOVE_API_URL ?? 'https://api-dreamlove.gesio.be'
const DL_USER = process.env.DREAMLOVE_USERNAME!
const DL_PASS = process.env.DREAMLOVE_PASSWORD!

// JWT token cache — tokens expire after 24h, refresh with 1h buffer
let cachedToken: string | null = null
let tokenExpiresAt = 0

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken

  const res = await fetch(`${API_BASE}/login_check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ username: DL_USER, password: DL_PASS }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`DreamLove auth failed: ${res.status}`)
  const data = await res.json() as { token: string }
  cachedToken = data.token
  // JWT expires in 24h — refresh 1h before expiry
  tokenExpiresAt = Date.now() + 23 * 60 * 60 * 1000
  return cachedToken
}

async function apiFetch<T>(path: string, options?: RequestInit, retries = 3): Promise<T> {
  const token = await getToken()
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30_000) // 30s per request
      const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        cache: 'no-store',
        signal: controller.signal,
      })
      clearTimeout(timeout)
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`DreamLove API ${res.status} ${path}: ${text.slice(0, 300)}`)
      }
      return res.json() as Promise<T>
    } catch (err) {
      if (attempt === retries) throw err
      // Exponential backoff: 2s, 4s
      await new Promise((r) => setTimeout(r, attempt * 2000))
    }
  }
  throw new Error(`apiFetch: exhausted retries for ${path}`)
}

// ---- Types -------------------------------------------------------

export interface ApiProduct {
  id: number
  sku: string | null
  name: string | null
  description: string | null
  longDescription: string | null
  costPrice: string | null
  price: string | null
  stock: string | null
  active: boolean
  new: boolean | null
  reducedPrice: boolean | null
  updatedAt: string
  createdAt: string | null
  weight: string | null
  width: string | null
  height: string | null
  length: string | null
  requiresRefrigeration: boolean | null
  brand: { id: number; name: string } | null
  mainCategory: ApiCategory | string | null
  categories: Array<ApiCategory | string>
  images: ApiImage[]
  barcodes: Array<{ id: number; barcode: string; type: string | null }> | null
  externalId: string | null
  vatGroup: { vatRates: Array<{ vatRate: { rate: string } }> } | null
}

export interface ApiCategory {
  id: number
  name: string | null
  code: string | null
  parent: ApiCategory | null
}

export interface ApiProductCategory {
  id: number
  name: string | null
  code: string | null
  parent: ApiProductCategory | null  // fully embedded object
}

export interface ApiProductCategoriesResponse {
  'hydra:member': ApiProductCategory[]
  'hydra:totalItems': number
  'hydra:view'?: {
    'hydra:next'?: string
  }
}

export interface ApiImage {
  id: number
  main: boolean | null
  order: number | null
  image: {
    files: Array<{
      type: string
      url: string
      dimensions: string | null
    }>
  } | null
}

export interface ApiStock {
  id: string
  product: { id: number; sku: string | null }
  warehouse: { id: number; name: string }
  available: number
  updatedAt: string
}

export interface ApiProductsResponse {
  'hydra:member': ApiProduct[]
  'hydra:totalItems': number
  'hydra:view'?: {
    'hydra:next'?: string
    'hydra:last'?: string
  }
}

export interface ApiStocksResponse {
  'hydra:member': ApiStock[]
  'hydra:totalItems': number
  'hydra:view'?: {
    'hydra:next'?: string
  }
}

// ---- Products --------------------------------------------------

export async function getProducts(params: {
  page?: number
  updatedAtAfter?: string
  active?: boolean
  pageSize?: number
}): Promise<ApiProductsResponse> {
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 1))
  if (params.updatedAtAfter) q.set('updatedAt[strictly_after]', params.updatedAtAfter)
  if (params.active !== undefined) q.set('active', params.active ? '1' : '0')
  if (params.pageSize) q.set('itemsPerPage', String(params.pageSize))
  q.set('order[id]', 'asc')

  return apiFetch<ApiProductsResponse>(`/products?${q}`, {
    headers: { 'Accept': 'application/ld+json' },
  })
}

export async function getProduct(id: number): Promise<ApiProduct> {
  return apiFetch<ApiProduct>(`/products/${id}`)
}

// ---- Product Categories ----------------------------------------

// Fetch English (language/51) name translations for all product categories
// Returns Map<categoryId, englishName>
export async function getEnglishCategoryNames(): Promise<Map<number, string>> {
  const result = new Map<number, string>()
  let page = 1
  while (true) {
    const q = new URLSearchParams()
    q.set('language', '/languages/51')
    q.set('field', 'name')
    q.set('page', String(page))
    q.set('itemsPerPage', '50')
    const res = await apiFetch<{ 'hydra:member': Array<{ value: string | null; productCategory: string }>; 'hydra:view'?: { 'hydra:next'?: string } }>(
      `/product_category_translations?${q}`,
      { headers: { 'Accept': 'application/ld+json' } },
    )
    for (const t of res['hydra:member']) {
      if (!t.value) continue
      const m = String(t.productCategory).match(/\/(\d+)$/)
      if (m) result.set(parseInt(m[1], 10), t.value)
    }
    if (!res['hydra:view']?.['hydra:next']) break
    page++
  }
  return result
}

// Fetch all brands and return:
// - Map<brandName (lowercase), logoUrl>  — for name-based lookup
// - Map<brandId, {name, logo}>           — for IRI-based lookup ("/brands/634")
export async function getBrandLogoMap(): Promise<Map<string, string>> {
  const { byName } = await getBrandMaps()
  return byName
}

export async function getBrandMaps(): Promise<{
  byName: Map<string, string>
  byId: Map<number, { name: string; logo: string | null }>
}> {
  const byName = new Map<string, string>()
  const byId = new Map<number, { name: string; logo: string | null }>()
  let page = 1
  while (true) {
    const q = new URLSearchParams({ page: String(page), itemsPerPage: '100' })
    const res = await apiFetch<{
      'hydra:member': Array<{ '@id': string; id: number; name: string; image: { files: Array<{ url: string }> } | null }>
      'hydra:view'?: { 'hydra:next'?: string }
    }>(`/brands?${q}`, { headers: { 'Accept': 'application/ld+json' } })
    for (const brand of res['hydra:member']) {
      if (!brand.name) continue
      const url = brand.image?.files?.[0]?.url ?? null
      byId.set(brand.id, { name: brand.name, logo: url })
      if (url) byName.set(brand.name.toLowerCase(), url)
    }
    if (!res['hydra:view']?.['hydra:next']) break
    page++
  }
  return { byName, byId }
}

export async function getAllProductCategories(): Promise<Map<number, ApiProductCategory>> {
  const result = new Map<number, ApiProductCategory>()
  let page = 1
  while (true) {
    const q = new URLSearchParams()
    q.set('page', String(page))
    q.set('itemsPerPage', '200')
    const res = await apiFetch<ApiProductCategoriesResponse>(`/product_categories?${q}`, {
      headers: { 'Accept': 'application/ld+json' },
    })
    for (const cat of res['hydra:member']) {
      result.set(cat.id, cat)
    }
    if (!res['hydra:view']?.['hydra:next']) break
    page++
  }
  return result
}

// ---- Single product stock (realtime check) ---------------------

export async function getProductStock(dreamloveId: string): Promise<{ available: boolean; stock: number }> {
  const res = await apiFetch<ApiStocksResponse>(
    `/available_stocks?product=/products/${dreamloveId}&itemsPerPage=1`,
    { headers: { 'Accept': 'application/ld+json' } },
  )
  const entry = res['hydra:member']?.[0]
  const stock = entry?.available ?? 0
  return { available: stock > 0, stock }
}

// ---- Stock -----------------------------------------------------

export async function getAvailableStocks(params: {
  page?: number
  updatedAfterDate?: string
  productId?: number
}): Promise<ApiStocksResponse> {
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 1))
  if (params.updatedAfterDate) q.set('updatedAfterDate', params.updatedAfterDate)
  if (params.productId) q.set('product', `/products/${params.productId}`)

  return apiFetch<ApiStocksResponse>(`/available_stocks?${q}`, {
    headers: { 'Accept': 'application/ld+json' },
  })
}

// ---- Orders ----------------------------------------------------

export interface ApiOrderPayload {
  referenceId: string
  shipping: {
    name: string
    street: string
    city: string
    postalCode: string
    country: string  // ISO 3166-1 alpha-2 code e.g. "CZ"
    phone: string
    email: string
  }
  items: Array<{
    productId: number
    quantity: number
    unitPrice?: number
  }>
  customerTaxId?: string
}

export interface ApiOrderResult {
  success: boolean
  orderId?: number
  orderNum?: string
  errorMessage?: string
  raw?: unknown
}

export async function createOrder(payload: ApiOrderPayload): Promise<ApiOrderResult> {
  try {
    const body = {
      num: payload.referenceId,
      dropshipping: true,
      status: 'pending',
      customer: {
        name: payload.shipping.name,
        taxIdentificationNumber: payload.customerTaxId ?? 'DROPSHIP',
        email: payload.shipping.email,
      },
      shippingAddress: {
        address: payload.shipping.street,
        postalCode: payload.shipping.postalCode,
        city: payload.shipping.city,
        dropshipping: true,
        country: { isoCode: payload.shipping.country },
      },
      lines: payload.items.map((item) => ({
        product: { id: item.productId },
        qty: item.quantity,
        price: item.unitPrice != null ? String(item.unitPrice) : undefined,
      })),
    }

    const result = await apiFetch<{ id: number; num: string }>('/orders', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    return {
      success: true,
      orderId: result.id,
      orderNum: result.num,
      raw: result,
    }
  } catch (err) {
    return {
      success: false,
      errorMessage: String(err),
    }
  }
}
