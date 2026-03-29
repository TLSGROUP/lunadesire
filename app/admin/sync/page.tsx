import { getSyncLogs } from '@/actions/admin/sync'
import { SyncStatus } from '@/components/admin/SyncStatus'
import { TriggerSyncButton } from '@/components/admin/TriggerSyncButton'

export const metadata = { title: 'Sync — Admin' }

export default async function SyncPage() {
  const logs = await getSyncLogs(20)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Feed Sync</h1>
        <TriggerSyncButton />
      </div>
      <SyncStatus logs={logs} />
    </div>
  )
}
