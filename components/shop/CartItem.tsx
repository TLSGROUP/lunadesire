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
    <div className="flex gap-4 items-start border rounded-lg p-3">
      <div className="w-16 h-16 bg-muted rounded shrink-0">
        {product.images?.[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-contain rounded"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm line-clamp-2">{product.name}</p>
        <p className="text-sm text-muted-foreground mt-0.5">
          {formatPrice(product.retail_price)} each
        </p>

        <div className="flex items-center gap-2 mt-2">
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(() => { void updateCartQuantity(item.id, item.quantity - 1) })
            }
            className="w-7 h-7 border rounded text-sm hover:bg-muted disabled:opacity-50"
          >
            −
          </button>
          <span className="text-sm w-6 text-center">{item.quantity}</span>
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(() => { void updateCartQuantity(item.id, item.quantity + 1) })
            }
            className="w-7 h-7 border rounded text-sm hover:bg-muted disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>

      <div className="text-right shrink-0">
        <p className="font-semibold">{formatPrice(product.retail_price * item.quantity)}</p>
        <button
          disabled={isPending}
          onClick={() => startTransition(() => { void removeFromCart(item.id) })}
          className="text-muted-foreground hover:text-destructive mt-2 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
