'use client'

import { useTransition, useState } from 'react'
import { createOrder } from '@/actions/checkout'
import { useRouter } from 'next/navigation'

export function CheckoutForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createOrder({
        name: fd.get('name') as string,
        street: fd.get('street') as string,
        city: fd.get('city') as string,
        postalCode: fd.get('postalCode') as string,
        country: fd.get('country') as string,
        phone: fd.get('phone') as string,
        email: fd.get('email') as string,
      })

      if (result.error) {
        setError(result.error)
      } else if (result.orderId) {
        router.push(`/account/orders/${result.orderId}`)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="font-semibold text-lg">Shipping Address</h2>

      {error && (
        <p className="bg-destructive/10 text-destructive text-sm p-3 rounded">{error}</p>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Full Name</label>
        <input name="name" required className="w-full border rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Street Address</label>
        <input name="street" required className="w-full border rounded px-3 py-2 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <input name="city" required className="w-full border rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Postal Code</label>
          <input name="postalCode" required className="w-full border rounded px-3 py-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Country</label>
        <input name="country" defaultValue="US" required className="w-full border rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input name="phone" type="tel" required className="w-full border rounded px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input name="email" type="email" required className="w-full border rounded px-3 py-2 text-sm" />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {isPending ? 'Placing order…' : 'Place Order'}
      </button>
    </form>
  )
}
