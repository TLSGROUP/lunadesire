import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCarousel } from '@/components/shop/ProductCarousel'
import { BannerCarousel } from '@/components/shop/BannerCarousel'
import { Footer } from '@/components/layout/Footer'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isValidLocale } from '@/lib/i18n/config'
import { notFound } from 'next/navigation'
import type { Locale } from '@/lib/i18n/config'

interface Props {
  params: Promise<{ locale: string }>
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  if (!isValidLocale(locale)) notFound()
  const t = await getDictionary(locale as Locale)
  const supabase = await createClient()

  const { data: newArrivalsRaw } = await supabase
    .from('products')
    .select('id, name, slug, retail_price, images, brand, stock_quantity, is_new, brand_logo')
    .eq('is_active', true)
    .eq('is_new', true)
    .not('images', 'is', null)
    .limit(499)

  // Load translations for current locale
  const arrivalIds = (newArrivalsRaw ?? []).map((p) => p.id)
  const trMap = new Map<string, string>()
  if (arrivalIds.length > 0) {
    // Supabase .in() max ~300 items, batch if needed
    for (let i = 0; i < arrivalIds.length; i += 300) {
      const { data: trs } = await supabase
        .from('product_translations')
        .select('product_id, name')
        .eq('locale', locale)
        .in('product_id', arrivalIds.slice(i, i + 300))
      for (const t of trs ?? []) {
        if (t.name) trMap.set(t.product_id, t.name)
      }
    }
  }

  const newArrivals = (newArrivalsRaw ?? []).map((p) => ({
    ...p,
    name: trMap.get(p.id) ?? p.name,
  }))
  for (let i = newArrivals.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArrivals[i], newArrivals[j]] = [newArrivals[j], newArrivals[i]]
  }

  const base = `/${locale}`

  return (
    <>
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <video className="absolute inset-0 w-full h-full object-cover" src="/video-bg.mov" autoPlay muted loop playsInline />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p className="text-xs tracking-[0.4em] uppercase text-[#d4006e] mb-6">{t.home.heroTag}</p>
          <h1 className="font-serif text-6xl md:text-8xl text-[#f2ede8] leading-tight mb-6">
            {t.home.heroTitle1}<br />
            <em className="italic text-[#d4006e]">{t.home.heroTitle2}</em>
          </h1>
          <p className="text-sm text-[#7a7078] leading-relaxed mb-10 max-w-md mx-auto">
            {t.home.heroSubtitle}
          </p>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="max-w-[1600px] mx-auto px-6 mb-12">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-serif text-4xl text-gray-900 mb-3">{t.home.curatedTitle}</h2>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                {t.home.curatedSubtitle}
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-[1700px] mx-auto px-6">
          <BannerCarousel locale={locale} />
        </div>
      </section>

      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-serif text-3xl md:text-5xl text-gray-800 italic leading-tight">
            &ldquo;{t.home.quote}&rdquo;
          </p>
        </div>
      </section>

      {newArrivals.length > 0 && (
        <section className="bg-white py-24">
          <div className="max-w-[1600px] px-6 mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs tracking-widest uppercase text-[#d4006e] mb-2">{t.home.justArrived}</p>
                <h2 className="font-serif text-4xl text-gray-900">{t.home.newArrivals}</h2>
              </div>
              <Link href={`${base}/products?new=true`} className="text-xs tracking-widest uppercase text-gray-400 hover:text-[#d4006e] transition-colors duration-300">
                {t.home.seeAll}
              </Link>
            </div>
            <ProductCarousel products={newArrivals} locale={locale} labels={{ inStock: t.products.inStock, outOfStock: t.products.outOfStock, vatIncl: t.products.vatIncl }} />
          </div>
        </section>
      )}
      <Footer locale={locale} />
    </>
  )
}
