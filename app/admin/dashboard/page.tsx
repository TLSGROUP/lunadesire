import { createClient } from '@/lib/supabase/server'
import { StatsCard } from '@/components/admin/StatsCard'
import { formatPrice } from '@/lib/pricing'

export const metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboard() {
  const supabase = await createClient()

  const [
    { count: totalProducts },
    { count: totalOrders },
    { count: pendingOrders },
    { data: revenue },
    { data: recentSync },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('orders')
      .select('total')
      .eq('payment_status', 'paid'),
    supabase
      .from('sync_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  const totalRevenue = (revenue ?? []).reduce(
    (sum: number, o: { total: number }) => sum + o.total,
    0,
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Active Products" value={totalProducts ?? 0} />
        <StatsCard title="Total Orders" value={totalOrders ?? 0} />
        <StatsCard title="Pending Orders" value={pendingOrders ?? 0} highlight />
        <StatsCard title="Total Revenue" value={formatPrice(totalRevenue)} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Last Sync</h2>
        {recentSync ? (
          <div className="bg-muted p-4 rounded-lg text-sm space-y-1">
            <p>
              <span className="font-medium">Status:</span>{' '}
              <span
                className={
                  recentSync.status === 'success'
                    ? 'text-green-600'
                    : recentSync.status === 'error'
                      ? 'text-destructive'
                      : 'text-yellow-600'
                }
              >
                {recentSync.status}
              </span>
            </p>
            <p>
              <span className="font-medium">Products synced:</span>{' '}
              {recentSync.products_synced}
            </p>
            <p>
              <span className="font-medium">Deactivated:</span>{' '}
              {recentSync.products_deactivated}
            </p>
            <p>
              <span className="font-medium">Started:</span>{' '}
              {new Date(recentSync.started_at).toLocaleString('en')}
            </p>
            {recentSync.error_message && (
              <p className="text-destructive">
                <span className="font-medium">Error:</span> {recentSync.error_message}
              </p>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">No sync run yet.</p>
        )}
      </div>
    </div>
  )
}
