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

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    cache: 'no-store',
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`DreamLove API ${res.status} ${path}: ${text.slice(0, 300)}`)
  }
  return res.json()
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
  mainCategory: ApiCategory | null
  categories: ApiCategory[]
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
