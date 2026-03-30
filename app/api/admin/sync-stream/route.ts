import { type NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { runFullSync } from '@/lib/dreamlove/sync'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes

export async function GET(request: NextRequest) {
  // Auth check
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

      // Create sync log entry
      const { data: log } = await admin
        .from('sync_logs')
        .insert({ type: 'full', status: 'running' })
        .select()
        .single()

      send({ stage: 'start', message: 'Sync started...' })

      try {
        const result = await runFullSync((event) => send(event))

        await admin.from('sync_logs').update({
          status: result.errors.length > 0 ? 'error' : 'success',
          products_synced: result.synced,
          products_deactivated: result.deactivated,
          error_message: result.errors.length > 0 ? result.errors.slice(0, 5).join('\n') : null,
          finished_at: new Date().toISOString(),
        }).eq('id', log!.id)

        send({ stage: 'done', synced: result.synced, deactivated: result.deactivated, errors: result.errors.slice(0, 5) })
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
