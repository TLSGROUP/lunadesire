import { getAdminProducts } from '@/actions/admin/products'
import { ProductTable } from '@/components/admin/ProductTable'

export const metadata = { title: 'Products — Admin' }

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function AdminProductsPage({ searchParams }: Props) {
  const { page: pageStr } = await searchParams
  const page = parseInt(pageStr ?? '1', 10)

  const { data: products, count } = await getAdminProducts(page, 50)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Products ({count})</h1>
      <ProductTable products={products} page={page} total={count} pageSize={50} />
    </div>
  )
}
