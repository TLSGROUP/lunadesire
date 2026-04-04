import { createClient } from '@/lib/supabase/server'
import { InfiniteProductGrid } from '@/components/shop/InfiniteProductGrid'
import { CategoryFilters } from '@/components/shop/CategoryFilters'
import { Footer } from '@/components/layout/Footer'
import { isValidLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Locale } from '@/lib/i18n/config'

interface Props {
  params: Promise<{ locale: string }>
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

export default async function ProductsPage({ params, searchParams }: Props) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()
  const t = await getDictionary(locale as Locale)

  const { category, brand, q, new: isNew } = await searchParams
  const pageSize = 48
  const base = `/${locale}`

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

  const { data: rawProducts, count } = await query

  // Load translations for current locale
  const productIds = (rawProducts ?? []).map((p: { id: string }) => p.id)
  let translationMap = new Map<string, { name: string | null }>()
  if (productIds.length > 0) {
    const { data: translations } = await supabase
      .from('product_translations')
      .select('product_id, name')
      .eq('locale', locale)
      .in('product_id', productIds)
    for (const t of translations ?? []) {
      translationMap.set(t.product_id, { name: t.name })
    }
  }
  const products = (rawProducts ?? []).map((p) => {
    const tr = translationMap.get(p.id)
    return { ...p, name: tr?.name ?? p.name }
  })

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
              <Link href={base} className="hover:text-[#d4006e] transition-colors">{t.product.home}</Link>
              {breadcrumb.map((b) => (
                <span key={b.id} className="flex items-center gap-2">
                  <span>/</span>
                  <Link href={`${base}/products?category=${encodeURIComponent(b.slug)}`} className="hover:text-[#d4006e] transition-colors">
                    {b.name.split('|').pop()}
                  </Link>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs tracking-widest uppercase text-[#d4006e] mb-2">{t.products.theCollection}</p>
          )}

          <div className="flex items-end justify-between">
            <h1 className="font-serif text-3xl text-gray-900">
              {q ? `"${q}"` : isNew ? t.products.newArrivals : currentCat ? currentCat.name.split('|').pop()! : t.products.allProducts}
            </h1>
            {count !== null && (
              <span className="text-xs text-gray-400">{count} {t.products.items}</span>
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
            locale={locale}
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
            locale={locale}
            labels={{ inStock: t.products.inStock, outOfStock: t.products.outOfStock, vatIncl: t.products.vatIncl }}
          />
        </div>
        <Footer locale={locale} />
      </div>
    </div>
  )
}
