import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ShoppingCart, User } from 'lucide-react'

export async function Header() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <header className="border-b bg-background sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl tracking-tight">
          LunaDesire
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/products" className="hover:text-primary transition-colors">
            Shop
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/cart" className="hover:text-primary transition-colors">
            <ShoppingCart className="h-5 w-5" />
          </Link>
          {user ? (
            <Link href="/account" className="hover:text-primary transition-colors">
              <User className="h-5 w-5" />
            </Link>
          ) : (
            <Link
              href="/auth/login"
              className="text-sm hover:text-primary transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
