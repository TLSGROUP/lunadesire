interface SyncLog {
  id: string
  type: string
  status: string
  products_synced: number
  products_deactivated: number
  error_message: string | null
  started_at: string
  finished_at: string | null
}

export function SyncStatus({ logs }: { logs: SyncLog[] }) {
  if (logs.length === 0) {
    return <p className="text-muted-foreground text-sm">No sync runs yet.</p>
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b">
          <tr>
            <th className="text-left px-4 py-2 font-medium">Started</th>
            <th className="text-left px-4 py-2 font-medium">Type</th>
            <th className="text-center px-4 py-2 font-medium">Status</th>
            <th className="text-right px-4 py-2 font-medium">Synced</th>
            <th className="text-right px-4 py-2 font-medium">Deactivated</th>
            <th className="text-left px-4 py-2 font-medium">Error</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-muted/30">
              <td className="px-4 py-2 text-muted-foreground">
                {new Date(log.started_at).toLocaleString('en')}
              </td>
              <td className="px-4 py-2 capitalize">{log.type}</td>
              <td className="px-4 py-2 text-center">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${
                    log.status === 'success'
                      ? 'text-green-700 bg-green-50 border-green-200'
                      : log.status === 'error'
                        ? 'text-red-700 bg-red-50 border-red-200'
                        : 'text-yellow-700 bg-yellow-50 border-yellow-200'
                  }`}
                >
                  {log.status}
                </span>
              </td>
              <td className="px-4 py-2 text-right">{log.products_synced}</td>
              <td className="px-4 py-2 text-right">{log.products_deactivated}</td>
              <td className="px-4 py-2 text-xs text-destructive truncate max-w-xs">
                {log.error_message ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
