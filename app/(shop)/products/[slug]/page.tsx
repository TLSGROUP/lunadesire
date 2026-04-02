import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/pricing'
import { AddToCartButton } from '@/components/shop/AddToCartButton'
import { ProductImageGallery } from '@/components/shop/ProductImageGallery'

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

  return (
    <div className="pt-20 min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-16">
          {/* Images */}
          <ProductImageGallery images={images} name={product.name} />

          {/* Details */}
          <div className="space-y-6 pt-4">
            {product.brand && (
              <p className="text-xs tracking-widest uppercase text-[#d4006e]">
                {product.brand}
              </p>
            )}

            <h1 className="font-serif text-3xl text-gray-900 leading-snug">
              {product.name}
            </h1>

            <p className="text-2xl font-semibold text-gray-900">{formatPrice(product.retail_price)}</p>

            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${product.stock_quantity > 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-xs tracking-wide text-gray-500">
                {product.stock_quantity > 0 ? `In stock (${product.stock_quantity})` : 'Out of stock'}
              </span>
            </div>

            {product.stock_quantity > 0 && (
              <div className="pt-2">
                <AddToCartButton productId={product.id} />
              </div>
            )}

            <div className="w-12 h-px bg-gray-200" />

            {product.description && (
              <div
                className="text-sm text-gray-600 leading-relaxed prose prose-sm max-w-none
                  prose-p:text-gray-600 prose-li:text-gray-600 prose-strong:text-gray-900"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}

            {product.ean && (
              <p className="text-xs text-gray-400">EAN: {product.ean}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
