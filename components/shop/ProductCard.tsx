import Link from 'next/link'
import { formatPrice } from '@/lib/pricing'
import { ProductCardHover } from './ProductCardHover'

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

interface Props {
  product: Product
  compact?: boolean
}

export function ProductCard({ product, compact = false }: Props) {
  const image = product.images?.[0] ?? null

  if (compact) {
    return (
      <div className="group relative h-full flex flex-col">
        <Link href={`/products/${product.slug}`} className="flex flex-col h-full relative border border-gray-200 group-hover:border-gray-300 group-hover:shadow-xl transition-all duration-300">
          {/* NEW ribbon */}
          {product.is_new && (
            <div className="absolute top-0 left-0 w-24 h-24 overflow-hidden pointer-events-none z-10">
              <div className="absolute top-2 -left-8 w-32 py-2 bg-[#d4006e] text-white text-xs font-bold tracking-widest text-center rotate-[-45deg] shadow-lg">
                NEW
              </div>
            </div>
          )}

          {/* Stock badge */}
          <div className="flex justify-center">
            {product.stock_quantity > 0 ? (
              <span className="px-2 py-0.5 bg-[#2d6a2d] text-white text-[9px] font-semibold tracking-wider uppercase">
                In Stock ({product.stock_quantity})
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-[#555] text-white text-[9px] font-semibold tracking-wider uppercase">
                Out of Stock
              </span>
            )}
          </div>

          {/* Brand logo */}
          <div className="h-10 bg-white flex items-center justify-center px-3">
            {product.brand_logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.brand_logo} alt={product.brand ?? ''} className="max-h-8 max-w-full object-contain" />
            ) : product.brand ? (
              <span className="text-[9px] font-bold tracking-widest uppercase text-black truncate">{product.brand}</span>
            ) : null}
          </div>

          {/* Image */}
          <div className="flex-1 bg-white overflow-hidden">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt={product.name} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#ccc]">
                <span className="text-xs">No image</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-2 shrink-0 flex flex-col gap-1">
            <p className="text-xs text-gray-800 line-clamp-2 leading-snug">{product.name}</p>
            <div className="flex items-baseline justify-between mt-auto">
              <p className="text-base font-semibold text-gray-900">{formatPrice(product.retail_price)}</p>
              <span className="text-[9px] text-gray-400 tracking-wide uppercase">VAT incl.</span>
            </div>
          </div>
        </Link>
      </div>
    )
  }

  return (
    <div className="group relative flex flex-col h-full">
      <Link href={`/products/${product.slug}`} className="flex flex-col flex-1 relative border border-gray-200 group-hover:border-gray-300 group-hover:shadow-xl transition-all duration-300">
        {/* NEW ribbon */}
        {product.is_new && (
          <div className="absolute top-0 left-0 w-24 h-24 overflow-hidden pointer-events-none z-10">
            <div className="absolute top-2 -left-8 w-32 py-2 bg-[#d4006e] text-white text-xs font-bold tracking-widest text-center rotate-[-45deg] shadow-lg">
              NEW
            </div>
          </div>
        )}

        {/* 1. Stock badge — centered */}
        <div className="flex justify-center mb-1">
          {product.stock_quantity > 0 ? (
            <span className="px-3 py-1 bg-[#2d6a2d] text-white text-[10px] font-semibold tracking-wider uppercase">
              In Stock ({product.stock_quantity})
            </span>
          ) : (
            <span className="px-3 py-1 bg-[#555] text-white text-[10px] font-semibold tracking-wider uppercase">
              Out of Stock
            </span>
          )}
        </div>

        {/* 2. Brand logo */}
        <div className="h-12 bg-white flex items-center justify-center px-4">
          {product.brand_logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.brand_logo} alt={product.brand ?? ''} className="max-h-9 max-w-full object-contain" />
          ) : product.brand ? (
            <span className="text-xs font-bold tracking-widest uppercase text-black">{product.brand}</span>
          ) : null}
        </div>

        {/* 3. Product image */}
        <div className="aspect-square bg-white overflow-hidden mb-3">
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={product.name} className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#ccc]">
              <span className="text-xs">No image</span>
            </div>
          )}
        </div>

        <div className="flex flex-col flex-1 p-3">
          <p className="text-sm text-gray-800 line-clamp-2 leading-snug flex-1">{product.name}</p>
          <div className="flex items-baseline justify-between mt-2">
            <p className="text-lg font-semibold text-gray-900">{formatPrice(product.retail_price)}</p>
            <span className="text-[10px] text-gray-400 tracking-wide uppercase">VAT incl.</span>
          </div>
        </div>
      </Link>

      {/* Hover panel — below the card */}
      {product.stock_quantity > 0 && <ProductCardHover productId={product.id} />}
    </div>
  )
}
