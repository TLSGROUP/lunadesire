'use client'

import { useState, useTransition } from 'react'
import { addToCart } from '@/actions/cart'

interface ColorOption {
  id: number
  name: string
  code: string | null
}

interface SizeOption {
  id: number
  name: string
  code: string | null
}

interface Props {
  productId: string
  colors: ColorOption[]
  sizes: SizeOption[]
}

export function ProductOptions({ productId, colors, sizes }: Props) {
  const hasColors = colors.length > 0
  const hasSize = sizes.length > 0

  const [selectedColor, setSelectedColor] = useState<number | null>(
    hasColors ? colors[0].id : null,
  )
  const [selectedSize, setSelectedSize] = useState<number | null>(
    hasSize ? sizes[0].id : null,
  )
  const [qty, setQty] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleAdd() {
    if (hasColors && selectedColor === null) {
      setError('Please select a color')
      return
    }
    if (hasSize && selectedSize === null) {
      setError('Please select a size')
      return
    }
    setError(null)

    // Encode selected options as a variantId string for cart tracking
    const variantKey = [
      selectedColor != null ? `c${selectedColor}` : null,
      selectedSize != null ? `s${selectedSize}` : null,
    ]
      .filter(Boolean)
      .join('_') || undefined

    startTransition(async () => {
      const result = await addToCart(productId, variantKey, qty)
      if (!result.error) {
        setAdded(true)
        setTimeout(() => setAdded(false), 2000)
      }
    })
  }

  return (
    <div className="space-y-5">
      {/* Color selector */}
      {hasColors && (
        <div>
          <p className="text-xs tracking-widest uppercase text-gray-400 mb-2">
            Color
            {selectedColor !== null && (
              <span className="ml-2 text-gray-600 normal-case tracking-normal">
                — {colors.find((c) => c.id === selectedColor)?.name}
              </span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelectedColor(c.id); setError(null) }}
                className={`px-3 py-1.5 text-xs tracking-wide border transition-colors duration-150 ${
                  selectedColor === c.id
                    ? 'border-[#d4006e] text-[#d4006e] bg-[#fff0f7]'
                    : 'border-gray-200 text-gray-700 hover:border-gray-400'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size selector */}
      {hasSize && (
        <div>
          <p className="text-xs tracking-widest uppercase text-gray-400 mb-2">Size</p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s.id}
                onClick={() => { setSelectedSize(s.id); setError(null) }}
                className={`px-3 py-1.5 text-xs tracking-wide border transition-colors duration-150 ${
                  selectedSize === s.id
                    ? 'border-[#d4006e] text-[#d4006e] bg-[#fff0f7]'
                    : 'border-gray-200 text-gray-700 hover:border-gray-400'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-xs text-red-500">{error}</p>}

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
