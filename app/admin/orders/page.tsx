import { getAdminOrders } from '@/actions/admin/orders'
import { OrderTable } from '@/components/admin/OrderTable'

export const metadata = { title: 'Orders — Admin' }

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { page: pageStr } = await searchParams
  const page = parseInt(pageStr ?? '1', 10)

  const { data: orders, count } = await getAdminOrders(page, 50)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders ({count})</h1>
      <OrderTable orders={orders} page={page} total={count} pageSize={50} />
    </div>
  )
}
