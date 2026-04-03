import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SyncPanel } from '@/components/admin/SyncPanel'

export const metadata = { title: 'Sync — Admin' }

export default async function SyncPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = await createServiceClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/')

  const [{ data: logs }, { count: totalProducts }] = await Promise.all([
    admin
      .from('sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(20),
    admin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
  ])

  const allLogs = logs ?? []
  const lastLog = allLogs[0] ?? null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">DreamLove Sync</h1>
        <p className="text-sm text-gray-400 mt-0.5">Synchronize products and stock from the DreamLove API</p>
      </div>
      <SyncPanel logs={allLogs} lastLog={lastLog} totalProducts={totalProducts ?? 0} />
    </div>
  )
}
