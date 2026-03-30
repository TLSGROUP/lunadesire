import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SyncStatus } from '@/components/admin/SyncStatus'
import { TriggerSyncButton } from '@/components/admin/TriggerSyncButton'

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

  const { data: logs } = await admin
    .from('sync_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(20)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Feed Sync</h1>
        <TriggerSyncButton />
      </div>
      <SyncStatus logs={logs ?? []} />
    </div>
  )
}
