import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ShoppingCart, User } from 'lucide-react'

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="text-2xl tracking-[0.35em] uppercase font-[family-name:var(--font-playfair)] font-bold text-[#f2ede8]">
          LunaDesire
        </Link>

        <nav className="hidden md:flex items-center gap-10 text-xs tracking-widest uppercase text-[#7a7078]">
          <Link href="/products" className="hover:text-[#c5a028] transition-colors duration-300">
            Shop
          </Link>
          <Link href="/products?category=toys" className="hover:text-[#c5a028] transition-colors duration-300">
            Toys & Devices
          </Link>
          <Link href="/products?category=lingerie" className="hover:text-[#c5a028] transition-colors duration-300">
            Lingerie
          </Link>
          <Link href="/products?category=care" className="hover:text-[#c5a028] transition-colors duration-300">
            Sensual Care
          </Link>
        </nav>

        <div className="flex items-center gap-5">
          <Link href="/cart" className="text-[#7a7078] hover:text-[#c5a028] transition-colors duration-300">
            <ShoppingCart className="h-5 w-5" />
          </Link>
          {user ? (
            <Link href="/account" className="text-[#7a7078] hover:text-[#c5a028] transition-colors duration-300">
              <User className="h-5 w-5" />
            </Link>
          ) : (
            <Link href="/auth/login" className="text-xs tracking-widest uppercase text-[#7a7078] hover:text-[#c5a028] transition-colors duration-300">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
