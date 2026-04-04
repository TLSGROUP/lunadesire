import { getCart } from '@/actions/cart'
import { CheckoutForm } from '@/components/shop/CheckoutForm'
import { formatPrice } from '@/lib/pricing'
import { isValidLocale } from '@/lib/i18n/config'
import { redirect, notFound } from 'next/navigation'

export const metadata = { title: 'Checkout' }

interface Props {
  params: Promise<{ locale: string }>
}

export default async function CheckoutPage({ params }: Props) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()

  const items = await getCart()
  if (items.length === 0) redirect(`/${locale}/cart`)

  const subtotal = items.reduce((sum, i) => {
    const product = i.product as { retail_price: number }
    return sum + product.retail_price * i.quantity
  }, 0)

  return (
    <div className="pt-20 min-h-screen bg-[#020104]">
      <div className="border-b border-[#1e181d] py-12">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs tracking-widest uppercase text-[#d4006e] mb-3">Checkout</p>
          <h1 className="font-serif text-4xl text-[#f2ede8]">Complete Your Order</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-5 gap-12">
          {/* Shipping form */}
          <div className="md:col-span-3">
            <CheckoutForm />
          </div>

          {/* Order summary */}
          <div className="md:col-span-2">
            <div className="border border-[#1e181d] p-6 space-y-4">
              <h2 className="text-xs tracking-widest uppercase text-[#7a7078]">Order Summary</h2>
              <div className="space-y-3">
                {items.map((item) => {
                  const product = item.product as { name: string; retail_price: number }
                  return (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-[#7a7078] line-clamp-1 flex-1 pr-4">
                        {product.name} <span className="text-[#4a4448]">×{item.quantity}</span>
                      </span>
                      <span className="text-[#f2ede8] shrink-0">{formatPrice(product.retail_price * item.quantity)}</span>
                    </div>
                  )
                })}
              </div>
              <div className="border-t border-[#1e181d] pt-4 flex justify-between">
                <span className="text-sm text-[#7a7078]">Subtotal</span>
                <span className="text-[#d4006e]">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-[#4a4448]">+ shipping (calculated next step)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
