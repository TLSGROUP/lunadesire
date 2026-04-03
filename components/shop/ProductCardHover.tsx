'use client'

import { useState, useTransition } from 'react'
import { addToCart } from '@/actions/cart'

export function ProductCardHover({ productId }: { productId: string }) {
  const [qty, setQty] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [added, setAdded] = useState(false)

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    startTransition(async () => {
      const result = await addToCart(productId, undefined, qty)
      if (!result.error) {
        setAdded(true)
        setTimeout(() => { setAdded(false); setQty(1) }, 2000)
      }
    })
  }

  function changeQty(e: React.MouseEvent, delta: number) {
    e.preventDefault()
    e.stopPropagation()
    setQty((q) => Math.max(1, q + delta))
  }

  return (
    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20 shadow-xl">
      <div className="flex">
        {/* Quantity selector */}
        <div className="flex items-center border-t border-gray-200 bg-white">
          <button
            onClick={(e) => changeQty(e, -1)}
            className="w-9 h-10 flex items-center justify-center text-gray-500 hover:text-[#d4006e] text-lg transition-colors"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-medium text-gray-900">{qty}</span>
          <button
            onClick={(e) => changeQty(e, 1)}
            className="w-9 h-10 flex items-center justify-center text-gray-500 hover:text-[#d4006e] text-lg transition-colors"
          >
            +
          </button>
        </div>

        {/* Add to cart button */}
        <button
          onClick={handleAdd}
          disabled={isPending}
          className="flex-1 h-10 bg-[#d4006e] text-white text-[10px] tracking-widest uppercase hover:bg-[#b8005e] disabled:opacity-50 transition-colors duration-200"
        >
          {isPending ? '…' : added ? '✓ Added' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
