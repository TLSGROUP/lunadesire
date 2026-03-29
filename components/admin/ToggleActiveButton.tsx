'use client'

import { useTransition } from 'react'
import { toggleProductActive } from '@/actions/admin/products'

export function ToggleActiveButton({
  productId,
  isActive,
}: {
  productId: string
  isActive: boolean
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(() => { void toggleProductActive(productId, !isActive) })
      }
      className={`text-xs px-2 py-0.5 rounded-full border transition-colors disabled:opacity-50 ${
        isActive
          ? 'text-green-700 border-green-300 bg-green-50 hover:bg-green-100'
          : 'text-muted-foreground border-muted-foreground/30 hover:bg-muted'
      }`}
    >
      {isActive ? 'Active' : 'Inactive'}
    </button>
  )
}
