import { getCart } from '@/actions/cart'
import { CheckoutForm } from '@/components/shop/CheckoutForm'
import { formatPrice } from '@/lib/pricing'
import { redirect } from 'next/navigation'

export const metadata = { title: 'Checkout' }

export default async function CheckoutPage() {
  const items = await getCart()
  if (items.length === 0) redirect('/cart')

  const subtotal = items.reduce((sum, i) => {
    const product = i.product as { retail_price: number }
    return sum + product.retail_price * i.quantity
  }, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Checkout</h1>

      <div className="grid md:grid-cols-5 gap-8">
        {/* Shipping form */}
        <div className="md:col-span-3">
          <CheckoutForm />
        </div>

        {/* Order summary */}
        <div className="md:col-span-2">
          <div className="bg-muted rounded-lg p-4 space-y-3">
            <h2 className="font-semibold text-lg">Order Summary</h2>
            {items.map((item) => {
              const product = item.product as { name: string; retail_price: number }
              return (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {product.name} × {item.quantity}
                  </span>
                  <span>{formatPrice(product.retail_price * item.quantity)}</span>
                </div>
              )
            })}
            <div className="border-t pt-2 flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
