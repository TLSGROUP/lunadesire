'use server'

import { createClient } from '@/lib/supabase/server'
import { createOrder } from '@/lib/dreamlove/api'
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

export async function submitOrderToDreamLove(orderId: string) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  // Fetch order with items and shipping address
  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .single()

  if (!order) return { error: 'Order not found' }
  if (order.dreamlove_order_id) {
    return { error: 'Order already submitted to DreamLove' }
  }

  const shipping = order.shipping_address as {
    name: string
    street: string
    city: string
    postalCode: string
    country: string
    phone: string
    email: string
  }

  const result = await createOrder({
    referenceId: order.id,
    shipping,
    items: order.order_items.map((i: { dreamlove_id: string; quantity: number; unit_price: number }) => ({
      productId: parseInt(i.dreamlove_id, 10),
      quantity: i.quantity,
      unitPrice: i.unit_price,
    })),
  })

  // Log result
  await supabase.from('sync_logs').insert({
    type: 'full',
    status: result.success ? 'success' : 'error',
    error_message: result.errorMessage ?? null,
    finished_at: new Date().toISOString(),
  })

  if (!result.success) {
    return { error: result.errorMessage ?? 'DreamLove rejected the order' }
  }

  // Update order with DreamLove ID
  await supabase
    .from('orders')
    .update({
      dreamlove_order_id: result.orderId ? String(result.orderId) : null,
      status: 'confirmed',
    })
    .eq('id', orderId)

  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)
  return { success: true, dreamloveOrderId: result.orderId ? String(result.orderId) : undefined }
}

export async function updateOrderStatus(
  orderId: string,
  status: string,
) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { error }

  const { error: updateError } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)

  if (updateError) return { error: updateError.message }
  revalidatePath('/admin/orders')
  revalidatePath(`/admin/orders/${orderId}`)
  return { success: true }
}

export async function getAdminOrders(page = 1, pageSize = 50) {
  const { supabase, error } = await requireAdmin()
  if (error || !supabase) return { data: [], count: 0, error }

  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, count } = await supabase
    .from('orders')
    .select('*, order_items(count)', { count: 'exact' })
    .range(from, to)
    .order('created_at', { ascending: false })

  return { data: data ?? [], count: count ?? 0 }
}
