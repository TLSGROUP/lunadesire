import { ProductCard } from './ProductCard'

interface Product {
  id: string
  name: string
  slug: string
  retail_price: number
  images: string[] | null
  brand: string | null
  stock_quantity: number
}

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-16">No products found.</p>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}
