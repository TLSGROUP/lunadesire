import { type NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { syncStocks } from '@/lib/dreamlove/sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = await createServiceClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      const { data: log } = await admin
        .from('sync_logs')
        .insert({ type: 'stock', status: 'running' })
        .select()
        .single()

      send({ stage: 'stock', message: 'Starting stock sync…' })

      try {
        const result = await syncStocks((event) => send(event))

        await admin.from('sync_logs').update({
          status: result.errors.length > 0 ? 'error' : 'success',
          products_synced: result.updated,
          error_message: result.errors.length > 0 ? result.errors.slice(0, 5).join('\n') : null,
          finished_at: new Date().toISOString(),
        }).eq('id', log!.id)

        send({ stage: 'done', updated: result.updated, errors: result.errors.slice(0, 5) })
      } catch (err) {
        await admin.from('sync_logs').update({
          status: 'error',
          error_message: String(err),
          finished_at: new Date().toISOString(),
        }).eq('id', log!.id)

        send({ stage: 'error', message: String(err) })
      }

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
