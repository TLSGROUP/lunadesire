import Link from 'next/link'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isValidLocale } from '@/lib/i18n/config'
import type { Locale } from '@/lib/i18n/config'

export async function Footer({ locale = 'en' }: { locale?: string }) {
  const base = `/${locale}`
  const t = isValidLocale(locale) ? await getDictionary(locale as Locale) : await getDictionary('en')

  return (
    <footer className="bg-[#020104] border-t border-[#1e181d] mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          <div>
            <p className="text-xl tracking-[0.35em] uppercase font-[family-name:var(--font-playfair)] font-bold text-[#f2ede8] mb-3">Luna<span className="text-[#d4006e]">Desire</span></p>
            <p className="text-xs text-[#4a4448] leading-relaxed">
              {t.home.heroSubtitle}
            </p>
          </div>

          <div>
            <p className="text-xs tracking-widest uppercase text-[#7a7078] mb-4">{t.nav.lovetoys}</p>
            <ul className="space-y-2">
              {[
                { label: t.nav.lovetoys, href: `${base}/products?category=lovetoys` },
                { label: t.nav.lingerie, href: `${base}/products?category=fashion-lingerie` },
                { label: t.nav.drugstore, href: `${base}/products?category=sex-drugstore` },
                { label: t.nav.condoms, href: `${base}/products?category=condoms` },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-xs text-[#4a4448] hover:text-[#d4006e] transition-colors duration-300">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs tracking-widest uppercase text-[#7a7078] mb-4">{t.footer.about}</p>
            <ul className="space-y-2">
              <li>
                <Link href={`${base}/products`} className="text-xs text-[#4a4448] hover:text-[#d4006e] transition-colors duration-300">
                  {t.products.allProducts}
                </Link>
              </li>
              <li>
                <Link href={`${base}/products?new=true`} className="text-xs text-[#4a4448] hover:text-[#d4006e] transition-colors duration-300">
                  {t.products.newArrivals}
                </Link>
              </li>
              <li>
                <Link href={`${base}`} className="text-xs text-[#4a4448] hover:text-[#d4006e] transition-colors duration-300">
                  {t.footer.contact}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-xs tracking-widest uppercase text-[#7a7078] mb-4">Newsletter</p>
            <p className="text-xs text-[#4a4448] mb-3">Subscribe for exclusive releases and editorial content</p>
            <form className="flex gap-2">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 bg-transparent border-b border-[#1e181d] text-xs text-[#f2ede8] placeholder-[#4a4448] pb-1 outline-none focus:border-[#d4006e] transition-colors duration-300"
              />
              <button type="submit" className="text-xs tracking-widest uppercase text-[#d4006e] hover:text-[#f2ede8] transition-colors duration-300">
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#1e181d] flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs text-[#4a4448]">
            &copy; {new Date().getFullYear()} LunaDesire. {t.footer.rights}
          </p>
          <p className="text-xs text-[#4a4448]">For adults 18+ only.</p>
          <div className="flex gap-6">
            <Link href="/" className="text-xs text-[#4a4448] hover:text-[#d4006e] transition-colors duration-300">{t.footer.privacy}</Link>
            <Link href="/" className="text-xs text-[#4a4448] hover:text-[#d4006e] transition-colors duration-300">{t.footer.terms}</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
