import { createClient } from '@/lib/supabase/server'
import { ProductGrid } from '@/components/shop/ProductGrid'
import { CategoryFilters } from '@/components/shop/CategoryFilters'
import Link from 'next/link'

export const metadata = { title: 'Collection' }

interface Props {
  searchParams: Promise<{ category?: string; brand?: string; q?: string; page?: string }>
}

interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
}

// Collect all descendant IDs recursively (including the root itself)
function collectDescendantIds(rootId: string, all: Category[]): string[] {
  const ids: string[] = [rootId]
  const children = all.filter((c) => c.parent_id === rootId)
  for (const child of children) {
    ids.push(...collectDescendantIds(child.id, all))
  }
  return ids
}

export default async function ProductsPage({ searchParams }: Props) {
  const { category, brand, q, page: pageStr } = await searchParams
  const page = parseInt(pageStr ?? '1', 10)
  const pageSize = 48
  const from = (page - 1) * pageSize

  const supabase = await createClient()

  // Load all categories once
  const { data: allCategories } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id')
    .order('name')

  const cats = (allCategories ?? []) as Category[]

  // Resolve current category
  let currentCat: Category | null = null
  if (category) {
    currentCat = cats.find((c) => c.slug === category) ?? null
  }

  // Subcategories to show as filter pills (direct children only)
  const subcategories = currentCat
    ? cats.filter((c) => c.parent_id === currentCat!.id)
    : cats.filter((c) => c.parent_id === null)

  // All descendant IDs for filtering
  const categoryIds = currentCat
    ? collectDescendantIds(currentCat.id, cats)
    : null

  // Build products query
  let query = supabase
    .from('products')
    .select('id, name, slug, retail_price, images, brand, stock_quantity', {
      count: 'exact',
    })
    .eq('is_active', true)
    .range(from, from + pageSize - 1)
    .order('name')

  if (q) query = query.ilike('name', `%${q}%`)
  if (brand) query = query.eq('brand', brand)
  if (categoryIds) query = query.in('category_id', categoryIds)

  const { data: products, count } = await query
  const totalPages = count ? Math.ceil(count / pageSize) : 1

  // Breadcrumb: walk up from current category to root
  const breadcrumb: Category[] = []
  if (currentCat) {
    let c: Category | undefined = currentCat
    while (c) {
      breadcrumb.unshift(c)
      c = c.parent_id ? cats.find((x) => x.id === c!.parent_id) : undefined
    }
  }

  return (
    <div className="pt-20 h-screen flex flex-col overflow-hidden">
      {/* Page header */}
      <div className="border-b border-[#1e181d] py-12 shrink-0">
        <div className="max-w-7xl mx-auto px-6">
          {/* Breadcrumb */}
          {breadcrumb.length > 0 ? (
            <div className="flex items-center gap-2 text-xs tracking-widest uppercase text-[#4a4448] mb-3">
              <Link href="/products" className="hover:text-[#c5a028] transition-colors">Collection</Link>
              {breadcrumb.map((b) => (
                <span key={b.id} className="flex items-center gap-2">
                  <span>/</span>
                  <Link href={`/products?category=${encodeURIComponent(b.slug)}`} className="hover:text-[#c5a028] transition-colors">
                    {b.name.split('|').pop()}
                  </Link>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs tracking-widest uppercase text-[#c5a028] mb-3">The Collection</p>
          )}

          <div className="flex items-end justify-between">
            <h1 className="font-serif text-5xl text-[#f2ede8]">
              {q ? `"${q}"` : currentCat ? currentCat.name.split('|').pop()! : 'All Products'}
            </h1>
            {count !== null && (
              <span className="text-xs text-[#4a4448]">{count} items</span>
            )}
          </div>
        </div>
      </div>

      {/* Subcategory filter pills */}
      {subcategories.length > 0 && (
        <div className="shrink-0">
          <CategoryFilters
            subcategories={subcategories.map((c) => ({
              slug: c.slug,
              name: c.name.split('|').pop()!,
            }))}
            currentSlug={category ?? null}
            parentSlug={currentCat?.parent_id ? cats.find((c) => c.id === currentCat!.parent_id)?.slug ?? null : null}
          />
        </div>
      )}

      {/* Scrollable products area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <ProductGrid products={products ?? []} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-3 mt-16">
              {page > 1 && (
                <Link
                  href={`/products?page=${page - 1}${category ? `&category=${encodeURIComponent(category)}` : ''}${q ? `&q=${q}` : ''}`}
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
                  href={`/products?page=${page + 1}${category ? `&category=${encodeURIComponent(category)}` : ''}${q ? `&q=${q}` : ''}`}
                  className="px-6 py-2 border border-[#1e181d] text-xs tracking-widest uppercase text-[#7a7078] hover:border-[#c5a028] hover:text-[#c5a028] transition-colors duration-300"
                >
                  Next
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
