import { getOrders } from '@/actions/account'
import { formatPrice } from '@/lib/pricing'
import Link from 'next/link'

export const metadata = { title: 'My Orders' }

export default async function OrdersPage() {
  const orders = await getOrders()

  if (orders.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Orders</h1>
        <p className="text-muted-foreground">No orders yet.</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Orders</h1>
      <div className="space-y-3">
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
            className="block border rounded-lg p-4 hover:bg-muted transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-mono text-sm text-muted-foreground">
                  #{order.id.slice(0, 8)}
                </p>
                <p className="text-sm mt-1">
                  {new Date(order.created_at).toLocaleDateString('en')}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatPrice(order.total)}</p>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full capitalize">
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
