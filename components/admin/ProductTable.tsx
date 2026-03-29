import Link from 'next/link'
import { formatPrice } from '@/lib/pricing'
import { ToggleActiveButton } from './ToggleActiveButton'

interface Product {
  id: string
  name: string
  dreamlove_id: string
  retail_price: number
  stock_quantity: number
  is_active: boolean
  brand: string | null
}

interface Props {
  products: Product[]
  page: number
  total: number
  pageSize: number
}

export function ProductTable({ products, page, total, pageSize }: Props) {
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Brand</th>
              <th className="text-right px-4 py-2 font-medium">Price</th>
              <th className="text-right px-4 py-2 font-medium">Stock</th>
              <th className="text-center px-4 py-2 font-medium">Active</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="px-4 py-2">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.dreamlove_id}</p>
                </td>
                <td className="px-4 py-2 text-muted-foreground">{p.brand ?? '—'}</td>
                <td className="px-4 py-2 text-right">{formatPrice(p.retail_price)}</td>
                <td
                  className={`px-4 py-2 text-right ${
                    p.stock_quantity === 0 ? 'text-destructive' : ''
                  }`}
                >
                  {p.stock_quantity}
                </td>
                <td className="px-4 py-2 text-center">
                  <ToggleActiveButton
                    productId={p.id}
                    isActive={p.is_active}
                  />
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="text-primary hover:underline text-xs"
                  >
                    Edit
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
              href={`/admin/products?page=${page - 1}`}
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
              href={`/admin/products?page=${page + 1}`}
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
