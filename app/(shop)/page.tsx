import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCarousel } from '@/components/shop/ProductCarousel'
import { BannerCarousel } from '@/components/shop/BannerCarousel'
import { Footer } from '@/components/layout/Footer'

export const metadata = { title: 'Home' }

export default async function HomePage() {
  const supabase = await createClient()

  const { data: newArrivalsRaw } = await supabase
    .from('products')
    .select('id, name, slug, retail_price, images, brand, stock_quantity, is_new, brand_logo')
    .eq('is_active', true)
    .eq('is_new', true)
    .not('images', 'is', null)
    .limit(499)

  // Fisher-Yates shuffle so same-brand products don't cluster
  const newArrivals = [...(newArrivalsRaw ?? [])]
  for (let i = newArrivals.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArrivals[i], newArrivals[j]] = [newArrivals[j], newArrivals[i]]
  }

  return (
    <>
      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background video */}
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src="/video-bg.mov"
          autoPlay
          muted
          loop
          playsInline
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p className="text-xs tracking-[0.4em] uppercase text-[#d4006e] mb-6">
            The Art of Intimacy
          </p>
          <h1 className="font-serif text-6xl md:text-8xl text-[#f2ede8] leading-tight mb-6">
            Elevate Your<br />
            <em className="italic text-[#d4006e]">Desires</em>
          </h1>
          <p className="text-sm text-[#7a7078] leading-relaxed mb-10 max-w-md mx-auto">
            Curated luxury wellness products designed for profound connection and aesthetic pleasure.
          </p>
        </div>
      </section>

      {/* Curated Selections */}
      <section className="bg-white py-24">
        <div className="max-w-[1600px] mx-auto px-6 mb-12">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-serif text-4xl text-gray-900 mb-3">Curated Selections</h2>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                Our signature pieces blending sophisticated design with unparalleled sensation.
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-[1700px] mx-auto px-6">
          <BannerCarousel />
        </div>
      </section>

      {/* Quote */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-serif text-3xl md:text-5xl text-gray-800 italic leading-tight">
            &ldquo;Beauty and pleasure are not mutually exclusive. They are the foundation of true intimacy.&rdquo;
          </p>
        </div>
      </section>

      {/* New Arrivals */}
      {(newArrivals ?? []).length > 0 && (
        <section className="bg-white py-24">
          <div className="max-w-[1600px] px-6 mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs tracking-widest uppercase text-[#d4006e] mb-2">Just Arrived</p>
                <h2 className="font-serif text-4xl text-gray-900">New Arrivals</h2>
              </div>
              <Link href="/products?new=true" className="text-xs tracking-widest uppercase text-gray-400 hover:text-[#d4006e] transition-colors duration-300">
                See All
              </Link>
            </div>
            <ProductCarousel products={newArrivals ?? []} />
          </div>
        </section>
      )}
      <Footer />
    </>
  )
}
