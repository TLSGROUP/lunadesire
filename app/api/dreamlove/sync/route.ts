import { type NextRequest, NextResponse } from 'next/server'
import { runFullSync } from '@/lib/dreamlove/sync'
import { createServiceClient } from '@/lib/supabase/server'

// POST /api/dreamlove/sync
// Protected by CRON_SECRET in Authorization header.
// Set up a Vercel Cron job or external cron to call this endpoint.
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createServiceClient()

  const { data: log } = await supabase
    .from('sync_logs')
    .insert({ type: 'full', status: 'running' })
    .select()
    .single()

  try {
    const result = await runFullSync()

    await supabase
      .from('sync_logs')
      .update({
        status: result.errors.length > 0 ? 'error' : 'success',
        products_synced: result.synced,
        products_deactivated: result.deactivated,
        error_message: result.errors.length > 0 ? result.errors.slice(0, 5).join('\n') : null,
        finished_at: new Date().toISOString(),
      })
      .eq('id', log!.id)

    return NextResponse.json(result)
  } catch (err) {
    await supabase
      .from('sync_logs')
      .update({
        status: 'error',
        error_message: String(err),
        finished_at: new Date().toISOString(),
      })
      .eq('id', log!.id)

    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
