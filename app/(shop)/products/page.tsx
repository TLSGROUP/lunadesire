import { createClient } from '@/lib/supabase/server'
import { ProductGrid } from '@/components/shop/ProductGrid'

export const metadata = { title: 'Products' }

interface Props {
  searchParams: Promise<{ category?: string; brand?: string; q?: string; page?: string }>
}

export default async function ProductsPage({ searchParams }: Props) {
  const { category, brand, q, page: pageStr } = await searchParams
  const page = parseInt(pageStr ?? '1', 10)
  const pageSize = 48
  const from = (page - 1) * pageSize

  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('id, name, slug, retail_price, images, brand, stock_quantity, category:categories(name)', {
      count: 'exact',
    })
    .eq('is_active', true)
    .range(from, from + pageSize - 1)
    .order('name')

  if (q) query = query.ilike('name', `%${q}%`)
  if (brand) query = query.eq('brand', brand)
  if (category) {
    query = query.eq('category.slug', category)
  }

  const { data: products, count } = await query

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        {q ? `Search: "${q}"` : 'All Products'}
        {count !== null && (
          <span className="text-base font-normal text-muted-foreground ml-2">
            ({count} items)
          </span>
        )}
      </h1>
      <ProductGrid products={products ?? []} />
    </div>
  )
}
