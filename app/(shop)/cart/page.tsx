import { getCart } from '@/actions/cart'
import { CartItem } from '@/components/shop/CartItem'
import { formatPrice } from '@/lib/pricing'
import Link from 'next/link'

export const metadata = { title: 'Cart' }

export default async function CartPage() {
  const items = await getCart()

  if (items.length === 0) {
    return (
      <div className="pt-20 min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xs tracking-widest uppercase text-[#4a4448] mb-6">Your Cart</p>
          <h1 className="font-serif text-3xl text-[#d4006e] mb-8">Your cart is empty</h1>
          <Link
            href="/products"
            className="inline-block border border-[#d4006e] text-[#d4006e] px-8 py-3 text-xs tracking-widest uppercase hover:bg-[#d4006e] hover:text-black transition-colors duration-300"
          >
            Browse Collection
          </Link>
        </div>
      </div>
    )
  }

  const subtotal = items.reduce((sum, i) => {
    const product = i.product as { retail_price: number }
    return sum + product.retail_price * i.quantity
  }, 0)

  return (
    <div className="pt-20 min-h-screen bg-white">
      <div className="border-b border-gray-200 py-12">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs tracking-widest uppercase text-[#d4006e] mb-3">Your Cart</p>
          <h1 className="font-serif text-4xl text-gray-900">Shopping Cart</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-3">
            {items.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </div>

          <div>
            <div className="border border-gray-200 p-6 space-y-4">
              <h2 className="text-xs tracking-widest uppercase text-gray-500">Order Summary</h2>
              <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                <span className="text-sm text-gray-500">Subtotal</span>
                <span className="text-lg text-gray-900 font-semibold">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-gray-400">Shipping calculated at checkout</p>
              <Link
                href="/checkout"
                className="block w-full text-center bg-[#d4006e] text-white py-4 text-xs tracking-widest uppercase hover:bg-[#b8005e] transition-colors duration-300"
              >
                Proceed to Checkout
              </Link>
              <Link
                href="/products"
                className="block w-full text-center border border-gray-300 text-gray-500 py-3 text-xs tracking-widest uppercase hover:border-[#d4006e] hover:text-[#d4006e] transition-colors duration-300"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
