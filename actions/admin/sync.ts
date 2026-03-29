'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { runFullSync } from '@/lib/dreamlove/sync'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { db: null, error: 'Not authenticated' }

  const admin = await createServiceClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return { db: null, error: 'Forbidden' }
  return { db: admin, error: null }
}

export async function triggerFullSync() {
  const { db, error } = await requireAdmin()
  if (error || !db) return { error }

  const { data: log, error: logError } = await db
    .from('sync_logs')
    .insert({ type: 'full', status: 'running' })
    .select()
    .single()

  if (logError || !log) return { error: logError?.message ?? 'Failed to create sync log' }

  try {
    const result = await runFullSync()

    await db
      .from('sync_logs')
      .update({
        status: result.errors.length > 0 ? 'error' : 'success',
        products_synced: result.synced,
        products_deactivated: result.deactivated,
        error_message: result.errors.length > 0 ? result.errors.slice(0, 5).join('\n') : null,
        finished_at: new Date().toISOString(),
      })
      .eq('id', log.id)

    revalidatePath('/admin/sync')
    return { success: true, result }
  } catch (err) {
    await db
      .from('sync_logs')
      .update({
        status: 'error',
        error_message: String(err),
        finished_at: new Date().toISOString(),
      })
      .eq('id', log.id)

    return { error: String(err) }
  }
}

export async function getSyncLogs(limit = 20) {
  const { db, error } = await requireAdmin()
  if (error || !db) return []

  const { data } = await db
    .from('sync_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit)

  return data ?? []
}
