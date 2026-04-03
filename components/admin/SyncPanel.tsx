'use client'

import { useState, useRef } from 'react'
import { RefreshCw, Zap, CheckCircle, XCircle, Clock, Package, Trash2, Square } from 'lucide-react'

interface LogLine {
  time: string
  stage: string
  message: string
  synced?: number
  total?: number
}

interface SyncLog {
  id: string
  type: string
  status: string
  products_synced: number | null
  products_deactivated: number | null
  error_message: string | null
  started_at: string
  finished_at: string | null
}

interface Props {
  lastLog: SyncLog | null
  logs: SyncLog[]
  totalProducts: number
}

const STAGE_LABELS: Record<string, string> = {
  start: 'Init',
  catalog: 'Catalog',
  categories: 'Categories',
  deactivate: 'Cleanup',
  stock: 'Stock',
  done: 'Done',
  error: 'Error',
}

const STAGE_COLORS: Record<string, string> = {
  start: 'text-blue-400',
  catalog: 'text-cyan-400',
  categories: 'text-purple-400',
  deactivate: 'text-yellow-400',
  stock: 'text-green-400',
  done: 'text-emerald-400',
  error: 'text-red-400',
}

function duration(start: string, end: string | null): string {
  if (!end) return '—'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'success')
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
        <CheckCircle className="w-3 h-3" /> success
      </span>
    )
  if (status === 'error')
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded-full">
        <XCircle className="w-3 h-3" /> error
      </span>
    )
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full">
      <Clock className="w-3 h-3" /> running
    </span>
  )
}

export function SyncPanel({ lastLog, logs, totalProducts }: Props) {
  const [running, setRunning] = useState(false)
  const [lines, setLines] = useState<LogLine[]>([])
  const [summary, setSummary] = useState<{ ok: boolean; text: string } | null>(null)
  const [syncType, setSyncType] = useState<'full' | 'stock' | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const stoppedRef = useRef(false)
  const logEndRef = useRef<HTMLDivElement>(null)

  function addLine(data: Record<string, unknown>) {
    setLines((prev) => {
      const next = [
        ...prev,
        {
          time: new Date().toLocaleTimeString('en', { hour12: false }),
          stage: String(data.stage ?? ''),
          message: String(data.message ?? ''),
          synced: data.synced as number | undefined,
          total: data.total as number | undefined,
        },
      ]
      setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 30)
      return next
    })
  }

  function handleStop() {
    stoppedRef.current = true
    abortRef.current?.abort()
    // setRunning(false) will be called in finally
  }

  async function handleSync(type: 'full' | 'stock') {
    setRunning(true)
    setSyncType(type)
    setLines([])
    setSummary(null)
    stoppedRef.current = false

    const controller = new AbortController()
    abortRef.current = controller

    const endpoint = type === 'full' ? '/api/admin/sync-stream' : '/api/admin/sync-stocks'

    try {
      const res = await fetch(endpoint, { signal: controller.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        if (stoppedRef.current) {
          reader.cancel()
          break
        }
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
              setSummary({
                ok: !data.errors?.length,
                text:
                  type === 'full'
                    ? `Synced ${data.synced} products, deactivated ${data.deactivated ?? 0}${data.errors?.length ? ` — ${data.errors.length} errors` : ''}`
                    : `Updated ${data.updated ?? 0} stock entries${data.errors?.length ? ` — ${data.errors.length} errors` : ''}`,
              })
            }
            if (data.stage === 'error') {
              setSummary({ ok: false, text: `Error: ${data.message}` })
            }
          } catch {}
        }
      }

      if (stoppedRef.current) {
        addLine({ stage: 'error', message: 'Stopped by user' })
        setSummary({ ok: false, text: 'Sync stopped by user' })
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        addLine({ stage: 'error', message: String(err) })
        setSummary({ ok: false, text: String(err) })
      } else if (stoppedRef.current) {
        addLine({ stage: 'error', message: 'Stopped by user' })
        setSummary({ ok: false, text: 'Sync stopped by user' })
      }
    } finally {
      setRunning(false)
      setSyncType(null)
    }
  }

  const progressLine = [...lines].reverse().find((l) => l.stage === 'catalog' && l.total)
  const pct = progressLine?.total
    ? Math.round(((progressLine.synced ?? 0) / progressLine.total) * 100)
    : null

  return (
    <div className="flex gap-6 items-start">

      {/* LEFT: controls + history */}
      <div className="shrink-0 w-[1200px] space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">Active Products</p>
            <p className="text-3xl font-semibold text-gray-900">{totalProducts.toLocaleString('en-US')}</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">Last Synced</p>
            <p className="text-sm font-medium text-gray-900">
              {lastLog
                ? new Date(lastLog.started_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
                : '—'}
            </p>
            {lastLog && (
              <p className="text-xs text-gray-400 mt-0.5">
                {lastLog.products_synced?.toLocaleString('en-US') ?? 0} products · {duration(lastLog.started_at, lastLog.finished_at)}
              </p>
            )}
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-xs tracking-widest uppercase text-gray-400 mb-1">Last Status</p>
            {lastLog ? (
              <div className="mt-1">
                <StatusBadge status={lastLog.status} />
                {lastLog.error_message && (
                  <p className="text-xs text-red-500 mt-1 truncate">{lastLog.error_message}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No runs yet</p>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {running ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium tracking-wide bg-red-500 hover:bg-red-600 text-white transition-colors"
            >
              <Square className="h-4 w-4 fill-white" />
              Stop
            </button>
          ) : (
            <>
              <button
                onClick={() => handleSync('full')}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium tracking-wide bg-[#d4006e] hover:bg-[#b8005e] text-white transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Full Sync
              </button>
              <button
                onClick={() => handleSync('stock')}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium tracking-wide border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Zap className="h-4 w-4" />
                Stock Only
              </button>
            </>
          )}
        </div>

        {/* History table */}
        <div>
          <p className="text-xs tracking-widest uppercase text-gray-400 mb-3">Sync History</p>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs tracking-wide text-gray-500 uppercase">
                  <th className="text-left px-4 py-3 font-medium">Started</th>
                  <th className="text-left px-4 py-3 font-medium">Type</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">
                    <span className="inline-flex items-center gap-1"><Package className="w-3 h-3" />Synced</span>
                  </th>
                  <th className="text-right px-4 py-3 font-medium">
                    <span className="inline-flex items-center gap-1"><Trash2 className="w-3 h-3" />Deact.</span>
                  </th>
                  <th className="text-right px-4 py-3 font-medium">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                      No sync runs yet
                    </td>
                  </tr>
                )}
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(log.started_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded capitalize">
                        {log.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {log.products_synced?.toLocaleString('en-US') ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {log.products_deactivated?.toLocaleString('en-US') ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs whitespace-nowrap">
                      {duration(log.started_at, log.finished_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RIGHT: terminal — fills all remaining width */}
      <div className="flex-1 min-w-0 border border-gray-200 rounded-lg overflow-hidden sticky top-6">
        {/* Terminal header */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#161b22] border-b border-[#30363d]">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <span className="w-3 h-3 rounded-full bg-[#28c840]" />
          <span className="ml-2 text-xs text-gray-500 font-mono">
            {syncType === 'full' ? 'full-sync' : syncType === 'stock' ? 'stock-sync' : 'terminal'}
          </span>
          {running && (
            <span className="ml-auto flex items-center gap-1.5 text-xs text-yellow-400">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              running
            </span>
          )}
        </div>

        {/* Progress bar */}
        {pct !== null && (
          <div className="px-4 py-2 bg-[#0d1117] border-b border-[#30363d]">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5 font-mono">
              <span>catalog</span>
              <span>{pct}% · {progressLine?.synced?.toLocaleString('en-US')} / {progressLine?.total?.toLocaleString('en-US')}</span>
            </div>
            <div className="w-full bg-[#30363d] rounded-full h-1">
              <div
                className="bg-[#d4006e] h-1 rounded-full transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}

        {/* Log output */}
        <div className="bg-[#0d1117] text-[#e6edf3] font-mono text-xs p-4 min-h-[520px] overflow-y-auto">
          {lines.length === 0 && !running && (
            <span className="text-gray-600">Waiting for sync to start…</span>
          )}
          {lines.map((l, i) => (
            <div key={i} className="flex gap-2 leading-5">
              <span className="text-[#484f58] shrink-0 select-none">{l.time}</span>
              <span className={`shrink-0 w-[90px] ${STAGE_COLORS[l.stage] ?? 'text-gray-400'}`}>
                [{STAGE_LABELS[l.stage] ?? l.stage}]
              </span>
              <span className="text-[#e6edf3] break-all">
                {l.message}
                {l.synced !== undefined && l.total !== undefined ? (
                  <span className="text-[#484f58]"> ({l.synced}/{l.total})</span>
                ) : l.synced !== undefined ? (
                  <span className="text-[#484f58]"> ({l.synced})</span>
                ) : null}
              </span>
            </div>
          ))}
          {running && (
            <div className="flex gap-2 leading-5 mt-0.5">
              <span className="text-[#484f58] select-none animate-pulse">▋</span>
            </div>
          )}
          <div ref={logEndRef} />
        </div>

        {/* Summary bar */}
        {summary && (
          <div
            className={`px-4 py-2 text-xs font-medium flex items-center gap-2 font-mono ${
              summary.ok
                ? 'bg-emerald-950 text-emerald-400 border-t border-emerald-900'
                : 'bg-red-950 text-red-400 border-t border-red-900'
            }`}
          >
            {summary.ok ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
            {summary.text}
          </div>
        )}
      </div>
    </div>
  )
}
