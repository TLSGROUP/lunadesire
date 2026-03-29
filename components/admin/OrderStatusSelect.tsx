'use client'

import { useTransition } from 'react'
import { updateOrderStatus } from '@/actions/admin/orders'

const statuses = [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded',
]

export function OrderStatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: string
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <select
      disabled={isPending}
      defaultValue={currentStatus}
      onChange={(e) => {
        const value = e.target.value
        startTransition(() => { void updateOrderStatus(orderId, value) })
      }}
      className="border rounded px-2 py-1 text-sm disabled:opacity-60"
    >
      {statuses.map((s) => (
        <option key={s} value={s}>
          {s.charAt(0).toUpperCase() + s.slice(1)}
        </option>
      ))}
    </select>
  )
}
