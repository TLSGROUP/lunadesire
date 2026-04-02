import { ProductCard } from './ProductCard'

interface Product {
  id: string
  name: string
  slug: string
  retail_price: number
  images: string[] | null
  brand: string | null
  stock_quantity: number
  is_new?: boolean | null
  brand_logo?: string | null
}

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="text-center py-24">
        <p className="text-xs tracking-widest uppercase text-[#4a4448]">No products found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}
