import Link from 'next/link'
import { formatPrice } from '@/lib/pricing'

interface Product {
  id: string
  name: string
  slug: string
  retail_price: number
  images: string[] | null
  brand: string | null
  stock_quantity: number
}

export function ProductCard({ product }: { product: Product }) {
  const image = product.images?.[0] ?? null

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-2">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
            No image
          </div>
        )}
      </div>
      <div>
        {product.brand && (
          <p className="text-xs text-muted-foreground uppercase tracking-wide truncate">
            {product.brand}
          </p>
        )}
        <p className="text-sm font-medium line-clamp-2 leading-snug mt-0.5">
          {product.name}
        </p>
        <p className="font-semibold mt-1">{formatPrice(product.retail_price)}</p>
        {product.stock_quantity === 0 && (
          <p className="text-xs text-destructive mt-0.5">Out of stock</p>
        )}
      </div>
    </Link>
  )
}
