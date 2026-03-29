'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateProfile(data: {
  full_name?: string
  phone?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/account/settings')
  return { success: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

export async function getOrders() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*, product:products(name, images))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return data ?? []
}

export async function getOrderById(orderId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*, product:products(*))')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  return data
}
