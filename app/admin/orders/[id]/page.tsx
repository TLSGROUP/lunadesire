import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/pricing'
import { SubmitToDreamLoveButton } from '@/components/admin/SubmitToDreamLoveButton'
import { OrderStatusSelect } from '@/components/admin/OrderStatusSelect'

interface Props {
  params: Promise<{ id: string }>
}

export const metadata = { title: 'Order Detail — Admin' }

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*, product:products(name, images))')
    .eq('id', id)
    .single()

  if (!order) notFound()

  const shipping = order.shipping_address as Record<string, string>

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.id.slice(0, 8)}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date(order.created_at).toLocaleString('en')}
          </p>
        </div>
        <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
      </div>

      {/* Shipping */}
      <section>
        <h2 className="font-semibold mb-2">Shipping Address</h2>
        <div className="bg-muted p-3 rounded text-sm space-y-0.5">
          <p>{shipping.name}</p>
          <p>{shipping.street}</p>
          <p>
            {shipping.city}, {shipping.postalCode}
          </p>
          <p>{shipping.country}</p>
          <p>{shipping.phone}</p>
          <p>{shipping.email}</p>
        </div>
      </section>

      {/* Items */}
      <section>
        <h2 className="font-semibold mb-2">Items</h2>
        <div className="border rounded-lg divide-y">
          {order.order_items.map(
            (item: {
              id: string
              name: string
              quantity: number
              unit_price: number
              total_price: number
            }) => (
              <div key={item.id} className="flex justify-between px-4 py-2 text-sm">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span>{formatPrice(item.total_price)}</span>
              </div>
            ),
          )}
        </div>
      </section>

      {/* Totals */}
      <div className="flex justify-between font-semibold text-lg border-t pt-3">
        <span>Total</span>
        <span>{formatPrice(order.total)}</span>
      </div>

      {/* DreamLove */}
      <section>
        <h2 className="font-semibold mb-2">DreamLove</h2>
        {order.dreamlove_order_id ? (
          <p className="text-green-600 text-sm">
            Submitted — DreamLove ID: {order.dreamlove_order_id}
          </p>
        ) : (
          <SubmitToDreamLoveButton orderId={order.id} />
        )}
      </section>
    </div>
  )
}
