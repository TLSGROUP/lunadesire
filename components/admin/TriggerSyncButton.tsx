'use client'

import { useState, useRef } from 'react'
import { RefreshCw } from 'lucide-react'

interface LogLine {
  time: string
  stage: string
  message: string
  synced?: number
  total?: number
}

export function TriggerSyncButton() {
  const [running, setRunning] = useState(false)
  const [lines, setLines] = useState<LogLine[]>([])
  const [summary, setSummary] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  function addLine(data: Record<string, unknown>) {
    const line: LogLine = {
      time: new Date().toLocaleTimeString(),
      stage: String(data.stage ?? ''),
      message: String(data.message ?? ''),
      synced: data.synced as number | undefined,
      total: data.total as number | undefined,
    }
    setLines((prev) => {
      const next = [...prev, line]
      setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      return next
    })
  }

  async function handleClick() {
    if (running) {
      abortRef.current?.abort()
      return
    }

    setRunning(true)
    setLines([])
    setSummary(null)

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/admin/sync-stream', { signal: controller.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''
        for (const part of parts) {
          const line = part.replace(/^data: /, '').trim()
          if (!line) continue
          try {
            const data = JSON.parse(line)
            addLine(data)
            if (data.stage === 'done') {
              setSummary(
                `✓ Synced ${data.synced} products, deactivated ${data.deactivated ?? 0}` +
                  (data.errors?.length ? ` — ${data.errors.length} errors` : ''),
              )
            }
            if (data.stage === 'error') {
              setSummary(`✗ Error: ${data.message}`)
            }
          } catch {}
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        addLine({ stage: 'error', message: String(err) })
      }
    } finally {
      setRunning(false)
    }
  }

  const progress = lines.findLast((l) => l.stage === 'catalog' && l.total)
  const pct = progress?.total ? Math.round(((progress.synced ?? 0) / progress.total) * 100) : null

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center gap-3">
        {summary && (
          <span className={`text-sm ${summary.startsWith('✗') ? 'text-destructive' : 'text-green-600'}`}>
            {summary}
          </span>
        )}
        <button
          onClick={handleClick}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors ml-auto"
        >
          <RefreshCw className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Stop' : 'Run Full Sync'}
        </button>
      </div>

      {pct !== null && (
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      {lines.length > 0 && (
        <div className="bg-black text-green-400 font-mono text-xs rounded-lg p-4 h-64 overflow-y-auto">
          {lines.map((l, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-gray-500 shrink-0">{l.time}</span>
              <span className="text-blue-400 shrink-0">[{l.stage}]</span>
              <span>
                {l.message}
                {l.synced !== undefined && l.total !== undefined
                  ? ` (${l.synced}/${l.total})`
                  : l.synced !== undefined
                  ? ` (${l.synced})`
                  : ''}
              </span>
            </div>
          ))}
          <div ref={logEndRef} />
        </div>
      )}
    </div>
  )
}
