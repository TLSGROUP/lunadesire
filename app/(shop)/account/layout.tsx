import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { signOut } from '@/actions/auth'

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
    <div className="pt-20 min-h-screen bg-white">
      <div className="border-b border-gray-200 py-12">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-xs tracking-widest uppercase text-[#d4006e] mb-3">My Account</p>
          <h1 className="font-serif text-4xl text-gray-900">Account</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-12">
          <nav className="space-y-1">
            <Link
              href="/account"
              className="block px-0 py-2.5 text-xs tracking-widest uppercase text-gray-500 border-b border-gray-200 hover:text-[#d4006e] transition-colors"
            >
              Profile
            </Link>
            <Link
              href="/account/orders"
              className="block px-0 py-2.5 text-xs tracking-widest uppercase text-gray-500 border-b border-gray-200 hover:text-[#d4006e] transition-colors"
            >
              Orders
            </Link>
            <Link
              href="/account/settings"
              className="block px-0 py-2.5 text-xs tracking-widest uppercase text-gray-500 border-b border-gray-200 hover:text-[#d4006e] transition-colors"
            >
              Settings
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="block w-full text-left px-0 py-2.5 text-xs tracking-widest uppercase text-gray-500 border-b border-gray-200 hover:text-[#d4006e] transition-colors"
              >
                Sign Out
              </button>
            </form>
          </nav>
          <div className="md:col-span-3">{children}</div>
        </div>
      </div>
    </div>
  )
}
