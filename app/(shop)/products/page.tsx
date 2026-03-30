import { createClient } from '@/lib/supabase/server'
import { ProductGrid } from '@/components/shop/ProductGrid'
import Link from 'next/link'

export const metadata = { title: 'Collection' }

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
  if (category) query = query.eq('category.slug', category)

  const { data: products, count } = await query
  const totalPages = count ? Math.ceil(count / pageSize) : 1

  return (
    <div className="pt-20">
      {/* Page header */}
      <div className="border-b border-[#1e181d] py-12">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-xs tracking-widest uppercase text-[#c5a028] mb-3">The Collection</p>
          <div className="flex items-end justify-between">
            <h1 className="font-serif text-5xl text-[#f2ede8]">
              {q ? `"${q}"` : 'All Products'}
            </h1>
            {count !== null && (
              <span className="text-xs text-[#4a4448]">{count} items</span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <ProductGrid products={products ?? []} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-3 mt-16">
            {page > 1 && (
              <Link
                href={`/products?page=${page - 1}${q ? `&q=${q}` : ''}`}
                className="px-6 py-2 border border-[#1e181d] text-xs tracking-widest uppercase text-[#7a7078] hover:border-[#c5a028] hover:text-[#c5a028] transition-colors duration-300"
              >
                Previous
              </Link>
            )}
            <span className="px-6 py-2 text-xs text-[#4a4448]">
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/products?page=${page + 1}${q ? `&q=${q}` : ''}`}
                className="px-6 py-2 border border-[#1e181d] text-xs tracking-widest uppercase text-[#7a7078] hover:border-[#c5a028] hover:text-[#c5a028] transition-colors duration-300"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
