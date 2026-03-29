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
      className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
    >
      {isPending ? 'Adding…' : added ? 'Added!' : 'Add to Cart'}
    </button>
  )
}
