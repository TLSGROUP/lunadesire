import { getCart } from '@/actions/cart'
import { CartItem } from '@/components/shop/CartItem'
import { formatPrice } from '@/lib/pricing'
import Link from 'next/link'

export const metadata = { title: 'Cart' }

export default async function CartPage() {
  const items = await getCart()

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <Link href="/products" className="text-primary hover:underline">
          Browse products
        </Link>
      </div>
    )
  }

  const subtotal = items.reduce((sum, i) => {
    const product = i.product as { retail_price: number }
    return sum + product.retail_price * i.quantity
  }, 0)

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart</h1>

      <div className="space-y-4 mb-8">
        {items.map((item) => (
          <CartItem key={item.id} item={item} />
        ))}
      </div>

      <div className="border-t pt-4 flex justify-between items-center mb-6">
        <span className="text-lg font-semibold">Subtotal</span>
        <span className="text-xl font-bold">{formatPrice(subtotal)}</span>
      </div>

      <Link
        href="/checkout"
        className="block w-full text-center bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
      >
        Proceed to Checkout
      </Link>
    </div>
  )
}
