'use client'

import { useTransition } from 'react'
import { removeFromCart, updateCartQuantity } from '@/actions/cart'
import { formatPrice } from '@/lib/pricing'
import { Trash2 } from 'lucide-react'

interface CartItemProps {
  item: {
    id: string
    quantity: number
    product: unknown
  }
}

export function CartItem({ item }: CartItemProps) {
  const [isPending, startTransition] = useTransition()
  const product = item.product as {
    name: string
    retail_price: number
    images: string[] | null
  }

  return (
    <div className="flex gap-4 items-start border border-[#1e181d] p-4">
      <div className="w-20 h-20 bg-[#0d080f] shrink-0">
        {product.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-[#333]">No image</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#f2ede8] leading-snug mb-1">{product.name}</p>
        <p className="text-xs text-[#7a7078]">
          {formatPrice(product.retail_price)} / шт.
        </p>

        <div className="flex items-center gap-3 mt-3">
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(() => { void updateCartQuantity(item.id, item.quantity - 1) })
            }
            className="w-7 h-7 border border-[#1e181d] text-[#7a7078] text-sm hover:border-[#c5a028] hover:text-[#c5a028] disabled:opacity-50 transition-colors"
          >
            −
          </button>
          <span className="text-sm text-[#f2ede8] w-5 text-center">{item.quantity}</span>
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(() => { void updateCartQuantity(item.id, item.quantity + 1) })
            }
            className="w-7 h-7 border border-[#1e181d] text-[#7a7078] text-sm hover:border-[#c5a028] hover:text-[#c5a028] disabled:opacity-50 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm text-[#c5a028]">{formatPrice(product.retail_price * item.quantity)}</p>
        <button
          disabled={isPending}
          onClick={() => startTransition(() => { void removeFromCart(item.id) })}
          className="text-[#4a4448] hover:text-[#8b1a3a] mt-3 disabled:opacity-50 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
