'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { addToCart } from '@/actions/cart'

interface Sibling {
  slug: string
  variant_color: string | null
  variant_size: string | null
  stock_quantity: number
}

interface Props {
  productId: string
  siblings: Sibling[]
  currentSlug: string
}

export function ProductVariantSelector({ productId, siblings, currentSlug }: Props) {
  const router = useRouter()
  const [qty, setQty] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [added, setAdded] = useState(false)

  // Derive unique colors and sizes from siblings (including current product)
  const colors = Array.from(
    new Map(
      siblings.filter((s) => s.variant_color).map((s) => [s.variant_color!, s])
    ).values()
  )
  const sizes = Array.from(
    new Map(
      siblings.filter((s) => s.variant_size).map((s) => [s.variant_size!, s])
    ).values()
  )

  const current = siblings.find((s) => s.slug === currentSlug)
  const [selectedColor, setSelectedColor] = useState<string | null>(current?.variant_color ?? null)
  const [selectedSize, setSelectedSize] = useState<string | null>(current?.variant_size ?? null)

  function navigate(color: string | null, size: string | null) {
    const match = siblings.find(
      (s) =>
        (colors.length === 0 || s.variant_color === color) &&
        (sizes.length === 0 || s.variant_size === size)
    )
    if (match && match.slug !== currentSlug) {
      router.push(`/products/${match.slug}`)
    }
  }

  function handleColorClick(color: string) {
    setSelectedColor(color)
    navigate(color, selectedSize)
  }

  function handleSizeClick(size: string) {
    setSelectedSize(size)
    navigate(selectedColor, size)
  }

  function handleAdd() {
    startTransition(async () => {
      const result = await addToCart(productId, undefined, qty)
      if (!result.error) {
        setAdded(true)
        setTimeout(() => setAdded(false), 2000)
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* Color selector */}
      {colors.length > 0 && (
        <div>
          <p className="text-xs tracking-widest uppercase text-gray-400 mb-2">
            Color
            {selectedColor && (
              <span className="ml-2 normal-case tracking-normal text-gray-600">— {selectedColor}</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((s) => {
              const inStock = s.stock_quantity > 0
              const isSelected = s.variant_color === selectedColor
              return (
                <button
                  key={s.variant_color}
                  onClick={() => inStock && handleColorClick(s.variant_color!)}
                  disabled={!inStock}
                  className={`px-3 py-1.5 text-xs tracking-wide border transition-colors duration-150 ${
                    isSelected
                      ? 'border-[#d4006e] text-[#d4006e] bg-[#fff0f7]'
                      : inStock
                      ? 'border-gray-200 text-gray-700 hover:border-gray-400'
                      : 'border-gray-100 text-gray-300 cursor-not-allowed line-through'
                  }`}
                >
                  {s.variant_color}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Size selector */}
      {sizes.length > 0 && (
        <div>
          <p className="text-xs tracking-widest uppercase text-gray-400 mb-2">Size</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => {
              const inStock = s.stock_quantity > 0
              const isSelected = s.variant_size === selectedSize
              return (
                <button
                  key={s.variant_size}
                  onClick={() => inStock && handleSizeClick(s.variant_size!)}
                  disabled={!inStock}
                  className={`min-w-[42px] px-3 py-1.5 text-xs tracking-wide border transition-colors duration-150 ${
                    isSelected
                      ? 'border-[#d4006e] text-[#d4006e] bg-[#fff0f7]'
                      : inStock
                      ? 'border-gray-200 text-gray-700 hover:border-gray-400'
                      : 'border-gray-100 text-gray-300 cursor-not-allowed line-through'
                  }`}
                >
                  {s.variant_size}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Qty + Add to Cart */}
      <div className="flex gap-3 items-center pt-1">
        <div className="flex items-center border border-gray-300">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-10 h-12 flex items-center justify-center text-gray-500 hover:text-[#d4006e] text-lg transition-colors"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-medium text-gray-900">{qty}</span>
          <button
            onClick={() => setQty((q) => q + 1)}
            className="w-10 h-12 flex items-center justify-center text-gray-500 hover:text-[#d4006e] text-lg transition-colors"
          >
            +
          </button>
        </div>

        <button
          onClick={handleAdd}
          disabled={isPending}
          className="flex-1 h-12 bg-[#d4006e] text-white text-xs tracking-widest uppercase hover:bg-[#b8005e] disabled:opacity-40 transition-colors duration-300"
        >
          {isPending ? 'Adding…' : added ? '✓ Added to Cart' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
