'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateRetailPrice } from '@/lib/pricing'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { supabase: null, error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { supabase: null, error: 'Forbidden' }
  return { supabase, error: null }
}

export async function updateProduct(
  productId: string,
  data: {
    name?: string
    description?: string
    markup_pct?: number
    retail_price?: number
    is_active?: boolean
  },
) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  // Recalculate retail price if markup changed
  if (data.markup_pct !== undefined) {
    const { data: product } = await supabase
      .from('products')
      .select('supplier_price')
      .eq('id', productId)
      .single()

    if (product) {
      data.retail_price = calculateRetailPrice(product.supplier_price, data.markup_pct)
    }
  }

  const { error: updateError } = await supabase
    .from('products')
    .update(data)
    .eq('id', productId)

  if (updateError) return { error: updateError.message }
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${productId}`)
  return { success: true }
}

export async function toggleProductActive(productId: string, isActive: boolean) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: updateError } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', productId)

  if (updateError) return { error: updateError.message }
  revalidatePath('/admin/products')
  return { success: true }
}

export async function getAdminProducts(page = 1, pageSize = 50) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { data: [], count: 0, error }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count } = await supabase
    .from('products')
    .select('*, category:categories(name), brand:brands(name)', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false })

  return { data: data ?? [], count: count ?? 0 }
}
