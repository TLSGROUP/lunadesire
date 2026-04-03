'use client'

import { useState, useTransition } from 'react'
import { addToCart } from '@/actions/cart'

export function AddToCartButton({
  productId,
  variantId,
}: {
  productId: string
  variantId?: string
}) {
  const [qty, setQty] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [added, setAdded] = useState(false)

  function handleClick() {
    startTransition(async () => {
      const result = await addToCart(productId, variantId, qty)
      if (!result.error) {
        setAdded(true)
        setTimeout(() => setAdded(false), 2000)
      }
    })
  }

  return (
    <div className="flex gap-3 items-center">
      {/* Quantity selector */}
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

      {/* Add to cart */}
      <button
        onClick={handleClick}
        disabled={isPending}
        className="flex-1 h-12 bg-[#d4006e] text-white text-xs tracking-widest uppercase hover:bg-[#b8005e] disabled:opacity-40 transition-colors duration-300"
      >
        {isPending ? 'Adding…' : added ? '✓ Added to Cart' : 'Add to Cart'}
      </button>
    </div>
  )
}
