export function calculateRetailPrice(supplierPrice: number, markupPct: number): number {
  return Math.round(supplierPrice * (1 + markupPct / 100) * 100) / 100
}

export function calculateMargin(supplierPrice: number, retailPrice: number): number {
  if (retailPrice === 0) return 0
  return Math.round(((retailPrice - supplierPrice) / retailPrice) * 100 * 100) / 100
}

export function calculateProfit(supplierPrice: number, retailPrice: number, quantity = 1): number {
  return Math.round((retailPrice - supplierPrice) * quantity * 100) / 100
}

/** Round to a psychologically attractive price ending in .99 */
export function charmPrice(price: number): number {
  return Math.floor(price) + 0.99
}

export function formatPrice(amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency }).format(amount)
}
