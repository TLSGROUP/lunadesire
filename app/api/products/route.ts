import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface Category {
  id: string
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const pageSize = 48
  const from = (page - 1) * pageSize
  const category = searchParams.get('category') ?? undefined
  const brand = searchParams.get('brand') ?? undefined
  const q = searchParams.get('q') ?? undefined
  const isNew = searchParams.get('new') ?? undefined

  const supabase = await createClient()

  const { data: allCategories } = await supabase
    .from('categories')
    .select('id, slug, parent_id')

  const cats = (allCategories ?? []) as Category[]
  const currentCat = category ? cats.find((c) => c.slug === category) ?? null : null
  const categoryIds = currentCat ? collectDescendantIds(currentCat.id, cats) : null

  let query = supabase
    .from('products')
    .select('id, name, slug, retail_price, images, brand, stock_quantity, is_new, brand_logo', { count: 'exact' })
    .eq('is_active', true)
    .range(from, from + pageSize - 1)
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

  return NextResponse.json({
    products: products ?? [],
    total: count ?? 0,
    page,
    hasMore: (count ?? 0) > page * pageSize,
  })
}
