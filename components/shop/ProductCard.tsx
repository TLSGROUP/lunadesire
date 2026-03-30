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

interface Props {
  product: Product
  compact?: boolean
}

export function ProductCard({ product, compact = false }: Props) {
  const image = product.images?.[0] ?? null

  if (compact) {
    return (
      <Link href={`/products/${product.slug}`} className="group block">
        <div className="aspect-square bg-[#0d080f] overflow-hidden mb-3">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#333]">
              <span className="text-xs">No image</span>
            </div>
          )}
        </div>
        <p className="text-xs text-[#7a7078] uppercase tracking-widest truncate mb-1">
          {product.brand ?? ''}
        </p>
        <p className="text-xs text-[#f2ede8] line-clamp-1">{product.name}</p>
        <p className="text-xs text-[#c5a028] mt-1">{formatPrice(product.retail_price)}</p>
      </Link>
    )
  }

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="aspect-[3/4] bg-[#0d080f] overflow-hidden mb-4 relative">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#333]">
            <span className="text-xs">No image</span>
          </div>
        )}
        {product.stock_quantity === 0 && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-xs tracking-widest uppercase text-[#7a7078]">Out of stock</span>
          </div>
        )}
      </div>

      <div>
        {product.brand && (
          <p className="text-xs tracking-widest uppercase text-[#4a4448] mb-1">
            {product.brand}
          </p>
        )}
        <p className="text-sm text-[#f2ede8] line-clamp-2 leading-snug mb-2">
          {product.name}
        </p>
        <p className="text-sm text-[#c5a028]">{formatPrice(product.retail_price)}</p>
      </div>
    </Link>
  )
}
