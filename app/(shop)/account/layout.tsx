import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-4 gap-8">
        <nav className="space-y-1">
          <Link
            href="/account"
            className="block px-3 py-2 rounded hover:bg-muted transition-colors"
          >
            Profile
          </Link>
          <Link
            href="/account/orders"
            className="block px-3 py-2 rounded hover:bg-muted transition-colors"
          >
            Orders
          </Link>
          <Link
            href="/account/settings"
            className="block px-3 py-2 rounded hover:bg-muted transition-colors"
          >
            Settings
          </Link>
        </nav>
        <div className="md:col-span-3">{children}</div>
      </div>
    </div>
  )
}
