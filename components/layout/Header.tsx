import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ShoppingCart, User } from 'lucide-react'
import { LocaleSwitcher } from './LocaleSwitcher'
import { getDictionary } from '@/lib/i18n/dictionaries'
import type { Locale } from '@/lib/i18n/config'

export async function Header({ locale }: { locale: Locale }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const t = await getDictionary(locale)

  let cartCount = 0
  if (user) {
    const { data } = await supabase
      .from('cart_items')
      .select('quantity')
      .eq('user_id', user.id)
    cartCount = (data ?? []).reduce((sum, item) => sum + (item.quantity ?? 1), 0)
  }

  const base = `/${locale}`

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-white/5">
      <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
        <Link href={base} className="text-2xl tracking-[0.35em] uppercase font-[family-name:var(--font-playfair)] font-bold text-[#f2ede8]">
          Luna<span className="text-[#d4006e]">Desire</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-xs tracking-widest uppercase text-[#f2ede8]">
          <Link href={`${base}/products?new=true`} className="hover:text-[#d4006e] transition-colors duration-300">{t.nav.new}</Link>
          <Link href={`${base}/products?category=lovetoys`} className="hover:text-[#d4006e] transition-colors duration-300">{t.nav.lovetoys}</Link>
          <Link href={`${base}/products?category=fashion-lingerie`} className="hover:text-[#d4006e] transition-colors duration-300">{t.nav.lingerie}</Link>
          <Link href={`${base}/products?category=sm-bondage`} className="hover:text-[#d4006e] transition-colors duration-300">{t.nav.smBondage}</Link>
          <Link href={`${base}/products?category=sex-drugstore`} className="hover:text-[#d4006e] transition-colors duration-300">{t.nav.drugstore}</Link>
          <Link href={`${base}/products?category=condoms`} className="hover:text-[#d4006e] transition-colors duration-300">{t.nav.condoms}</Link>
          <Link href={`${base}/products?category=games`} className="hover:text-[#d4006e] transition-colors duration-300">{t.nav.games}</Link>
          <Link href={`${base}/products?category=assorted-items`} className="hover:text-[#d4006e] transition-colors duration-300">{t.nav.assorted}</Link>
        </nav>

        <div className="flex items-center gap-5">
          <LocaleSwitcher locale={locale} />

          <Link href={`${base}/cart`} className="relative text-[#f2ede8] hover:text-[#d4006e] transition-colors duration-300">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#d4006e] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <Link href={`${base}/account`} className="text-[#f2ede8] hover:text-[#d4006e] transition-colors duration-300">
              <User className="h-5 w-5" />
            </Link>
          ) : (
            <Link href={`${base}/auth/login`} className="text-xs tracking-widest uppercase text-[#f2ede8] hover:text-[#d4006e] transition-colors duration-300">
              {t.nav.signIn}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
