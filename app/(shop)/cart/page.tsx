import { getCart } from '@/actions/cart'
import { CartItem } from '@/components/shop/CartItem'
import { formatPrice } from '@/lib/pricing'
import Link from 'next/link'

export const metadata = { title: 'Cart' }

export default async function CartPage() {
  const items = await getCart()

  if (items.length === 0) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xs tracking-widest uppercase text-[#4a4448] mb-6">Your Cart</p>
          <h1 className="font-serif text-3xl text-[#f2ede8] mb-8">Your cart is empty</h1>
          <Link
            href="/products"
            className="inline-block border border-[#c5a028] text-[#c5a028] px-8 py-3 text-xs tracking-widest uppercase hover:bg-[#c5a028] hover:text-black transition-colors duration-300"
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
    <div className="pt-20 min-h-screen bg-[#020104]">
      <div className="border-b border-[#1e181d] py-12">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-xs tracking-widest uppercase text-[#c5a028] mb-3">Your Cart</p>
          <h1 className="font-serif text-4xl text-[#f2ede8]">Shopping Cart</h1>
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
            <div className="border border-[#1e181d] p-6 space-y-4">
              <h2 className="text-xs tracking-widest uppercase text-[#7a7078]">Order Summary</h2>
              <div className="border-t border-[#1e181d] pt-4 flex justify-between items-center">
                <span className="text-sm text-[#7a7078]">Subtotal</span>
                <span className="text-lg text-[#f2ede8]">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-xs text-[#4a4448]">Shipping calculated at checkout</p>
              <Link
                href="/checkout"
                className="block w-full text-center bg-[#8b1a3a] text-white py-4 text-xs tracking-widest uppercase hover:bg-[#a82148] transition-colors duration-300"
              >
                Proceed to Checkout
              </Link>
              <Link
                href="/products"
                className="block w-full text-center border border-[#1e181d] text-[#7a7078] py-3 text-xs tracking-widest uppercase hover:border-[#c5a028] hover:text-[#c5a028] transition-colors duration-300"
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
