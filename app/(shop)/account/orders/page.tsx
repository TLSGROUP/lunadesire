import { getOrders } from '@/actions/account'
import { formatPrice } from '@/lib/pricing'
import Link from 'next/link'

export const metadata = { title: 'My Orders' }

export default async function OrdersPage() {
  const orders = await getOrders()

  if (orders.length === 0) {
    return (
      <div>
        <h2 className="font-serif text-2xl text-gray-900 mb-8">Orders</h2>
        <p className="text-xs tracking-widest uppercase text-gray-400">No orders yet.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="font-serif text-2xl text-gray-900 mb-8">Orders</h2>
      <div className="space-y-2">
        {orders.map((order: {
          id: string
          created_at: string
          status: string
          total: number
          payment_status: string
        }) => (
          <Link
            key={order.id}
            href={`/account/orders/${order.id}`}
            className="block border border-gray-200 p-4 hover:border-[#d4006e] transition-colors duration-300"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-mono text-xs text-gray-500">
                  #{order.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(order.created_at).toLocaleDateString('en')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">{formatPrice(order.total)}</p>
                <span className="text-xs tracking-widest uppercase text-gray-400 mt-1 block">
                  {order.status}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
