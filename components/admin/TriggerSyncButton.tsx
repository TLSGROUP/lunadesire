'use client'

import { useState, useTransition } from 'react'
import { triggerFullSync } from '@/actions/admin/sync'
import { RefreshCw } from 'lucide-react'

export function TriggerSyncButton() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<string | null>(null)

  function handleClick() {
    setResult(null)
    startTransition(async () => {
      const r = await triggerFullSync()
      if (r.error) {
        setResult(`Error: ${r.error}`)
      } else if (r.result) {
        setResult(
          `Done — synced ${r.result.synced}, deactivated ${r.result.deactivated}` +
            (r.result.errors.length > 0 ? `, ${r.result.errors.length} errors` : ''),
        )
      }
    })
  }

  return (
    <div className="flex items-center gap-3">
      {result && (
        <span className={`text-sm ${result.startsWith('Error') ? 'text-destructive' : 'text-green-600'}`}>
          {result}
        </span>
      )}
      <button
        disabled={isPending}
        onClick={handleClick}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} />
        {isPending ? 'Syncing…' : 'Run Full Sync'}
      </button>
    </div>
  )
}
