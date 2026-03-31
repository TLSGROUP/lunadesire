import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ProductCarousel } from '@/components/shop/ProductCarousel'
import { BannerCarousel } from '@/components/shop/BannerCarousel'

export const metadata = { title: 'Home' }

export default async function HomePage() {
  const supabase = await createClient()

  const { data: newArrivals } = await supabase
    .from('products')
    .select('id, name, slug, retail_price, images, brand, stock_quantity')
    .eq('is_active', true)
    .eq('is_new', true)
    .order('created_at', { ascending: false })
    .limit(499)

  return (
    <>
      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/hero-bg.png)' }}
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p className="text-xs tracking-[0.4em] uppercase text-[#c5a028] mb-6">
            The Art of Intimacy
          </p>
          <h1 className="font-serif text-6xl md:text-8xl text-[#f2ede8] leading-tight mb-6">
            Elevate Your<br />
            <em className="italic text-[#f2ede8]">Desires</em>
          </h1>
          <p className="text-sm text-[#7a7078] leading-relaxed mb-10 max-w-md mx-auto">
            Curated luxury wellness products designed for profound connection and aesthetic pleasure.
          </p>
          <Link
            href="/products"
            className="inline-block px-10 py-4 bg-[#8b1a3a] text-[#f2ede8] text-xs tracking-[0.3em] uppercase hover:bg-[#a82148] transition-colors duration-300"
          >
            Explore Collection
          </Link>
        </div>
      </section>

      {/* Curated Selections */}
      <section className="bg-[#020104] py-24">
        <div className="max-w-[1600px] mx-auto px-6 mb-12">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-serif text-4xl text-[#f2ede8] mb-3">Curated Selections</h2>
              <p className="text-xs text-[#4a4448] max-w-xs leading-relaxed">
                Our signature pieces blending sophisticated design with unparalleled sensation.
              </p>
            </div>
          </div>
        </div>
        <div className="max-w-[1600px] mx-auto px-6">
          <BannerCarousel />
        </div>
      </section>

      {/* Quote */}
      <section className="py-24 px-6 bg-[#07030b]">
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-serif text-3xl md:text-5xl text-[#f2ede8] italic leading-tight">
            &ldquo;Beauty and pleasure are not mutually exclusive. They are the foundation of true intimacy.&rdquo;
          </p>
        </div>
      </section>

      {/* New Arrivals */}
      {(newArrivals ?? []).length > 0 && (
        <section className="bg-[#020104] px-6 py-24">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs tracking-widest uppercase text-[#c5a028] mb-2">Just Arrived</p>
                <h2 className="font-serif text-4xl text-[#f2ede8]">New Arrivals</h2>
              </div>
              <Link href="/products?filter=new" className="text-xs tracking-widest uppercase text-[#7a7078] hover:text-[#c5a028] transition-colors duration-300">
                See All
              </Link>
            </div>
            <ProductCarousel products={newArrivals ?? []} />
          </div>
        </section>
      )}
    </>
  )
}
