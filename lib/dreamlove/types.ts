// ============================================================
// DreamLove data types
// Adapt field names after inspecting actual feed/WSDL responses.
// ============================================================

export interface DreamLoveTranslation {
  lang: string
  title?: string
  description?: string
  htmlDescription?: string
}

export interface DreamLoveProduct {
  id: string            // DreamLove product ID (string, treat as opaque)
  ean?: string
  name: string
  description?: string
  brand?: string
  brandId?: string
  categoryId?: string
  priceExVat: number        // cost_price (без НДС)
  priceWithVat: number      // price_with_taxes (с НДС 21%) — база для retail_price
  supplierPrice: number     // = priceWithVat, используется для наценки
  supplierShipping: number  // default_shipping_cost от DreamLove
  stock: number
  images?: string[]
  weight?: number          // shipping_weight in grams
  attributes?: Record<string, string>
  translations?: DreamLoveTranslation[]
  publicId?: string        // public_id e.g. 'D-196690'
  updatedAtSupplier?: string
  releaseDate?: string
  minUnits: number
  maxUnits: number
  vatPct?: number
  isSale: boolean
  isNew: boolean
  isRefrigerated: boolean
  widthMm?: number
  heightMm?: number
  depthMm?: number
  hsIntrastatCode?: string
}

export interface DreamLoveCategory {
  id: string
  name: string
  parentId?: string
}

export interface DreamLoveBrand {
  id: string
  name: string
}

export interface DreamLovePriceEntry {
  id: string            // product ID
  price: number         // supplier price
}

// SOAP order payload
export interface DreamLoveOrderPayload {
  referenceId: string   // Our internal order UUID — used as idempotency key
  shipping: {
    name: string
    street: string
    city: string
    postalCode: string
    country: string
    phone: string
    email: string
  }
  items: Array<{
    dreamloveId: string
    quantity: number
  }>
}

// SOAP response from getBasicProductInfo
export interface DreamLoveStockInfo {
  dreamloveId: string
  available: boolean
  stock: number
  price?: number
  rawXml: string        // always stored for debugging
}

// SOAP response from newOrder
export interface DreamLoveOrderResult {
  success: boolean
  dreamloveOrderId?: string
  errorMessage?: string
  rawXml: string
}

export interface SyncResult {
  synced: number
  updated: number
  deactivated: number
  errors: string[]
}
