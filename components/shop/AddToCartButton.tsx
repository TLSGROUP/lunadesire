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
  const [isPending, startTransition] = useTransition()
  const [added, setAdded] = useState(false)

  function handleClick() {
    startTransition(async () => {
      const result = await addToCart(productId, variantId, 1)
      if (!result.error) {
        setAdded(true)
        setTimeout(() => setAdded(false), 2000)
      }
    })
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="w-full bg-[#8b1a3a] text-white py-4 text-xs tracking-widest uppercase hover:bg-[#a82148] disabled:opacity-40 transition-colors duration-300"
    >
      {isPending ? 'Adding…' : added ? 'Added to Cart' : 'Add to Cart'}
    </button>
  )
}
