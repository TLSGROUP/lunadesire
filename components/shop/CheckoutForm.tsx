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

  const inputCls = "w-full bg-[#0d080f] border border-[#1e181d] text-[#f2ede8] px-4 py-3 text-sm focus:outline-none focus:border-[#d4006e] transition-colors"
  const labelCls = "block text-xs tracking-widest uppercase text-[#7a7078] mb-2"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-xs tracking-widest uppercase text-[#7a7078] mb-6">Shipping Address</h2>

      {error && (
        <p className="border border-[#8b1a3a] text-[#e07070] text-xs p-3 tracking-wide">{error}</p>
      )}

      <div>
        <label className={labelCls}>Full Name</label>
        <input name="name" required className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Street Address</label>
        <input name="street" required className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>City</label>
          <input name="city" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Postal Code</label>
          <input name="postalCode" required className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Country</label>
        <input name="country" defaultValue="CZ" required className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Phone</label>
        <input name="phone" type="tel" required className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Email</label>
        <input name="email" type="email" required className={inputCls} />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#8b1a3a] text-white py-4 text-xs tracking-widest uppercase hover:bg-[#a82148] disabled:opacity-40 transition-colors duration-300 mt-4"
      >
        {isPending ? 'Placing order…' : 'Place Order'}
      </button>
    </form>
  )
}
