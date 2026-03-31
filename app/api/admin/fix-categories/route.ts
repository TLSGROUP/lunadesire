import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fetchCatalog } from '@/lib/dreamlove/feed'

export async function POST() {
  const supabase = await createServiceClient()

  // Load all categories by name → id
  const { data: dbCategories } = await supabase
    .from('categories')
    .select('id, name, parent_id')

  const categoryMap = new Map(
    (dbCategories ?? []).map((c: { id: string; name: string; parent_id: string | null }) => [c.name, c.id])
  )

  // Fix parent_id hierarchy
  let hierarchyFixed = 0
  for (const cat of dbCategories ?? []) {
    const lastPipe = cat.name.lastIndexOf('|')
    if (lastPipe === -1) continue
    const parentName = cat.name.slice(0, lastPipe)
    const parentId = categoryMap.get(parentName)
    if (parentId && cat.parent_id !== parentId) {
      await supabase.from('categories').update({ parent_id: parentId }).eq('id', cat.id)
      hierarchyFixed++
    }
  }

  // Fetch full catalog and update category_id for every product
  const catalog = await fetchCatalog()

  let updated = 0
  let skipped = 0

  const CHUNK = 100
  for (let i = 0; i < catalog.length; i += CHUNK) {
    const chunk = catalog.slice(i, i + CHUNK)
    const updates = chunk
      .filter((p) => p.categoryId)
      .map((p) => {
        const catId = categoryMap.get(p.categoryId!) ?? null
        return { dreamlove_id: p.id, category_id: catId }
      })
      .filter((u) => u.category_id !== null)

    for (const u of updates) {
      const { error } = await supabase
        .from('products')
        .update({ category_id: u.category_id })
        .eq('dreamlove_id', u.dreamlove_id)
      if (!error) updated++
      else skipped++
    }
  }

  return NextResponse.json({ hierarchyFixed, updated, skipped, total: catalog.length })
}
