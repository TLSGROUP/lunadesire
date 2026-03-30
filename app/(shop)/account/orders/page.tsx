import { getOrders } from '@/actions/account'
import { formatPrice } from '@/lib/pricing'
import Link from 'next/link'

export const metadata = { title: 'My Orders' }

export default async function OrdersPage() {
  const orders = await getOrders()

  if (orders.length === 0) {
    return (
      <div>
        <h2 className="font-serif text-2xl text-[#f2ede8] mb-8">Orders</h2>
        <p className="text-xs tracking-widest uppercase text-[#4a4448]">No orders yet.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="font-serif text-2xl text-[#f2ede8] mb-8">Orders</h2>
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
            className="block border border-[#1e181d] p-4 hover:border-[#c5a028] transition-colors duration-300"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-mono text-xs text-[#4a4448]">
                  #{order.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-xs text-[#7a7078] mt-1">
                  {new Date(order.created_at).toLocaleDateString('en')}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-[#c5a028]">{formatPrice(order.total)}</p>
                <span className="text-xs tracking-widest uppercase text-[#4a4448] mt-1 block">
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
