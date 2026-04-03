'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addToCart(
  productId: string,
  variantId?: string,
  quantity = 1,
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('cart_items').upsert(
    {
      user_id: user.id,
      product_id: productId,
      variant_id: variantId ?? null,
      quantity,
    },
    { onConflict: 'user_id,product_id,variant_id' },
  )

  if (error) return { error: error.message }
  revalidatePath('/cart')
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function updateCartQuantity(cartItemId: string, quantity: number) {
  if (quantity < 1) return removeFromCart(cartItemId)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/cart')
  return { success: true }
}

export async function removeFromCart(cartItemId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/cart')
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function getCart() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('cart_items')
    .select('*, product:products(*), variant:product_variants(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return data ?? []
}

export async function clearCart() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  await supabase.from('cart_items').delete().eq('user_id', user.id)
  revalidatePath('/cart')
  return { success: true }
}
