import Link from 'next/link'
import { formatPrice } from '@/lib/pricing'

interface Order {
  id: string
  created_at: string
  status: string
  total: number
  payment_status: string
  dreamlove_order_id: string | null
}

interface Props {
  orders: Order[]
  page: number
  total: number
  pageSize: number
}

const statusColor: Record<string, string> = {
  pending: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  confirmed: 'text-blue-700 bg-blue-50 border-blue-200',
  processing: 'text-blue-700 bg-blue-50 border-blue-200',
  shipped: 'text-green-700 bg-green-50 border-green-200',
  delivered: 'text-green-700 bg-green-50 border-green-200',
  cancelled: 'text-muted-foreground bg-muted border-muted-foreground/20',
  refunded: 'text-red-700 bg-red-50 border-red-200',
}

export function OrderTable({ orders, page, total, pageSize }: Props) {
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Order</th>
              <th className="text-left px-4 py-2 font-medium">Date</th>
              <th className="text-center px-4 py-2 font-medium">Status</th>
              <th className="text-center px-4 py-2 font-medium">Payment</th>
              <th className="text-right px-4 py-2 font-medium">Total</th>
              <th className="text-left px-4 py-2 font-medium">DreamLove ID</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-muted/30">
                <td className="px-4 py-2 font-mono text-xs">{o.id.slice(0, 8)}</td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(o.created_at).toLocaleDateString('en')}
                </td>
                <td className="px-4 py-2 text-center">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border capitalize ${
                      statusColor[o.status] ?? ''
                    }`}
                  >
                    {o.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-center">
                  <span
                    className={`text-xs capitalize ${
                      o.payment_status === 'paid' ? 'text-green-600' : 'text-muted-foreground'
                    }`}
                  >
                    {o.payment_status}
                  </span>
                </td>
                <td className="px-4 py-2 text-right font-medium">
                  {formatPrice(o.total)}
                </td>
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                  {o.dreamlove_order_id ?? '—'}
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="text-primary hover:underline text-xs"
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 text-sm">
          {page > 1 && (
            <Link
              href={`/admin/orders?page=${page - 1}`}
              className="px-3 py-1 border rounded hover:bg-muted"
            >
              Previous
            </Link>
          )}
          <span className="px-3 py-1 text-muted-foreground">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/orders?page=${page + 1}`}
              className="px-3 py-1 border rounded hover:bg-muted"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
