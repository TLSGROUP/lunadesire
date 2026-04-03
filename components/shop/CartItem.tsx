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
    <div className="flex gap-4 items-start border border-gray-200 p-4">
      <div className="w-20 h-20 bg-gray-50 shrink-0 border border-gray-100">
        {product.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-gray-300">No image</span>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 leading-snug mb-1">{product.name}</p>
        <p className="text-xs text-gray-500">
          {formatPrice(product.retail_price)} / шт.
        </p>

        <div className="flex items-center gap-3 mt-3">
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(() => { void updateCartQuantity(item.id, item.quantity - 1) })
            }
            className="w-7 h-7 border border-gray-300 text-gray-500 text-sm hover:border-[#d4006e] hover:text-[#d4006e] disabled:opacity-50 transition-colors"
          >
            −
          </button>
          <span className="text-sm text-gray-900 w-5 text-center">{item.quantity}</span>
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(() => { void updateCartQuantity(item.id, item.quantity + 1) })
            }
            className="w-7 h-7 border border-gray-300 text-gray-500 text-sm hover:border-[#d4006e] hover:text-[#d4006e] disabled:opacity-50 transition-colors"
          >
            +
          </button>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-gray-900">{formatPrice(product.retail_price * item.quantity)}</p>
        <button
          disabled={isPending}
          onClick={() => startTransition(() => { void removeFromCart(item.id) })}
          className="text-gray-400 hover:text-[#d4006e] mt-3 disabled:opacity-50 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
