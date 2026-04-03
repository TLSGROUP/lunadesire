import { createClient } from '@/lib/supabase/server'
import { InfiniteProductGrid } from '@/components/shop/InfiniteProductGrid'
import { CategoryFilters } from '@/components/shop/CategoryFilters'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'

export const metadata = { title: 'Collection' }

interface Props {
  searchParams: Promise<{ category?: string; brand?: string; q?: string; new?: string }>
}

interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
}

function collectDescendantIds(rootId: string, all: Category[]): string[] {
  const ids: string[] = [rootId]
  const children = all.filter((c) => c.parent_id === rootId)
  for (const child of children) {
    ids.push(...collectDescendantIds(child.id, all))
  }
  return ids
}

export default async function ProductsPage({ searchParams }: Props) {
  const { category, brand, q, new: isNew } = await searchParams
  const pageSize = 48

  const supabase = await createClient()

  const { data: allCategories } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id')
    .order('name')

  const cats = (allCategories ?? []) as Category[]

  let currentCat: Category | null = null
  if (category) {
    currentCat = cats.find((c) => c.slug === category) ?? null
  }

  const subcategories = currentCat
    ? cats.filter((c) => c.parent_id === currentCat!.id)
    : cats.filter((c) => c.parent_id === null)

  const categoryIds = currentCat
    ? collectDescendantIds(currentCat.id, cats)
    : null

  // Initial page of products (SSR)
  let query = supabase
    .from('products')
    .select('id, name, slug, retail_price, images, brand, stock_quantity, is_new, brand_logo', { count: 'exact' })
    .eq('is_active', true)
    .range(0, pageSize - 1)
    .order('stock_quantity', { ascending: false })

  if (q) query = query.ilike('name', `%${q}%`)
  if (brand) query = query.eq('brand', brand)
  if (isNew) query = query.eq('is_new', true)
  if (isNew && category && currentCat) {
    query = query.in('category_id', collectDescendantIds(currentCat.id, cats))
  } else if (categoryIds) {
    query = query.in('category_id', categoryIds)
  }

  const { data: products, count } = await query

  // Breadcrumb
  const breadcrumb: Category[] = []
  if (currentCat) {
    let c: Category | undefined = currentCat
    while (c) {
      breadcrumb.unshift(c)
      c = c.parent_id ? cats.find((x) => x.id === c!.parent_id) : undefined
    }
  }

  const initialHasMore = (count ?? 0) > pageSize

  return (
    <div className="pt-20 h-screen flex flex-col overflow-hidden bg-white">
      {/* Page header */}
      <div className="border-b border-gray-200 py-6 shrink-0">
        <div className="max-w-[1600px] mx-auto px-6">
          {breadcrumb.length > 0 ? (
            <div className="flex items-center gap-2 text-xs tracking-widest uppercase text-gray-400 mb-2">
              <Link href="/" className="hover:text-[#d4006e] transition-colors">Home</Link>
              {breadcrumb.map((b) => (
                <span key={b.id} className="flex items-center gap-2">
                  <span>/</span>
                  <Link href={`/products?category=${encodeURIComponent(b.slug)}`} className="hover:text-[#d4006e] transition-colors">
                    {b.name.split('|').pop()}
                  </Link>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs tracking-widest uppercase text-[#d4006e] mb-2">The Collection</p>
          )}

          <div className="flex items-end justify-between">
            <h1 className="font-serif text-3xl text-gray-900">
              {q ? `"${q}"` : isNew ? 'New Arrivals' : currentCat ? currentCat.name.split('|').pop()! : 'All Products'}
            </h1>
            {count !== null && (
              <span className="text-xs text-gray-400">{count} items</span>
            )}
          </div>
        </div>
      </div>

      {/* Subcategory filter pills */}
      {!isNew && subcategories.length > 0 && (
        <div className="shrink-0">
          <CategoryFilters
            subcategories={subcategories.map((c) => ({
              slug: c.slug,
              name: c.name.split('|').pop()!,
            }))}
            currentSlug={category ?? null}
            containerSlug={currentCat?.slug ?? null}
          />
        </div>
      )}

      {/* Scrollable products area with infinite scroll */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto px-6 py-12">
          <InfiniteProductGrid
            initialProducts={products ?? []}
            initialHasMore={initialHasMore}
            searchParams={{ category, brand, q, new: isNew }}
          />
        </div>
        <Footer />
      </div>
    </div>
  )
}
