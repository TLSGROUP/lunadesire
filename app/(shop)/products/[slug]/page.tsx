import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/pricing'
import { AddToCartButton } from '@/components/shop/AddToCartButton'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('name, description')
    .eq('slug', slug)
    .single()

  if (!data) return {}
  return { title: data.name, description: data.description?.replace(/<[^>]*>/g, '').slice(0, 160) }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*, category:categories(name, slug), product_variants(*)')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!product) notFound()

  const images: string[] = product.images ?? []
  const primaryImage = images[0] ?? null

  return (
    <div className="pt-20 min-h-screen">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-16">
          {/* Images */}
          <div>
            <div className="aspect-square bg-[#0d080f] overflow-hidden mb-3">
              {primaryImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={primaryImage}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#333]">
                  <span className="text-xs">No image</span>
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.slice(1, 5).map((img, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={img}
                    alt={`${product.name} ${i + 2}`}
                    className="w-full aspect-square object-contain bg-[#0d080f]"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6 pt-4">
            {product.brand && (
              <p className="text-xs tracking-widest uppercase text-[#c5a028]">
                {product.brand}
              </p>
            )}

            <h1 className="font-serif text-3xl text-[#f2ede8] leading-snug">
              {product.name}
            </h1>

            <p className="text-2xl text-[#f2ede8]">{formatPrice(product.retail_price)}</p>

            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${product.stock_quantity > 0 ? 'bg-emerald-500' : 'bg-red-700'}`} />
              <span className="text-xs tracking-wide text-[#7a7078]">
                {product.stock_quantity > 0 ? 'In stock' : 'Out of stock'}
              </span>
            </div>

            {product.stock_quantity > 0 && (
              <div className="pt-2">
                <AddToCartButton productId={product.id} />
              </div>
            )}

            <div className="w-12 h-px bg-[#1e181d]" />

            {product.description && (
              <div
                className="text-sm text-[#7a7078] leading-relaxed prose prose-sm prose-invert max-w-none
                  prose-p:text-[#7a7078] prose-li:text-[#7a7078] prose-strong:text-[#f2ede8]"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}

            {product.ean && (
              <p className="text-xs text-[#4a4448]">EAN: {product.ean}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
