import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { formatPrice } from '@/lib/pricing'
import { AddToCartButton } from '@/components/shop/AddToCartButton'
import { ProductVariantSelector } from '@/components/shop/ProductVariantSelector'
import { ProductImageGallery } from '@/components/shop/ProductImageGallery'
import { Footer } from '@/components/layout/Footer'
import Link from 'next/link'

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

  // Fetch sibling variants (same product_group_key)
  type Sibling = { slug: string; variant_color: string | null; variant_size: string | null; stock_quantity: number }
  let siblings: Sibling[] = []
  if (product.product_group_key) {
    const { data: siblingData } = await supabase
      .from('products')
      .select('slug, variant_color, variant_size, stock_quantity')
      .eq('product_group_key', product.product_group_key)
    siblings = (siblingData ?? []) as Sibling[]
  }
  // Fallback: if no siblings found but the product itself has variant info, treat it as sole sibling
  if (siblings.length === 0 && (product.variant_color || product.variant_size)) {
    siblings = [{ slug, variant_color: product.variant_color ?? null, variant_size: product.variant_size ?? null, stock_quantity: product.stock_quantity }]
  }

  // Build breadcrumb segments from category name path "ROOT|Sub|SubSub"
  const categoryName = (product.category as { name: string; slug: string } | null)?.name ?? ''
  const segments = categoryName ? categoryName.split('|') : []

  // For each segment, find its category slug by matching name prefix
  const { data: allCats } = await supabase
    .from('categories')
    .select('name, slug')

  const catList = (allCats ?? []) as { name: string; slug: string }[]

  const breadcrumbSegments = segments.map((_, i) => {
    const pathPrefix = segments.slice(0, i + 1).join('|')
    const match = catList.find((c) => c.name === pathPrefix)
    return { label: segments[i], slug: match?.slug ?? null }
  })

  return (
    <>
    <div className="pt-20 min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs tracking-widest uppercase text-gray-400 mb-8 flex-wrap">
          <Link href="/" className="hover:text-[#d4006e] transition-colors">Home</Link>
          {breadcrumbSegments.map((seg) => (
            <span key={seg.label} className="flex items-center gap-2">
              <span>/</span>
              {seg.slug ? (
                <Link href={`/products?category=${encodeURIComponent(seg.slug)}`} className="hover:text-[#d4006e] transition-colors">
                  {seg.label}
                </Link>
              ) : (
                <span>{seg.label}</span>
              )}
            </span>
          ))}
          <span>/</span>
          <span className="text-gray-600 truncate max-w-xs">{product.name}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-16">
          {/* Images + Specs below */}
          <div className="flex flex-col gap-8">
            <ProductImageGallery images={images} name={product.name} />

            {/* Specifications — under gallery */}
            {(product.weight_grams || product.width_mm || product.height_mm || product.depth_mm) && (
              <div>
                <p className="text-xs tracking-widest uppercase text-gray-400 mb-3">Specifications</p>
                <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {product.weight_grams && (
                    <>
                      <dt className="text-xs text-gray-400">Weight</dt>
                      <dd className="text-xs text-gray-700">
                        {product.weight_grams >= 1000
                          ? `${(product.weight_grams / 1000).toFixed(2).replace(/\.?0+$/, '')} kg`
                          : `${product.weight_grams} g`}
                      </dd>
                    </>
                  )}
                  {(product.width_mm || product.height_mm || product.depth_mm) && (
                    <>
                      <dt className="text-xs text-gray-400">Package size</dt>
                      <dd className="text-xs text-gray-700">
                        {[product.width_mm, product.height_mm, product.depth_mm]
                          .filter(Boolean)
                          .map((v) => `${v} mm`)
                          .join(' × ')}
                      </dd>
                    </>
                  )}
                </dl>
              </div>
            )}
          </div>

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
                {siblings.length > 0 ? (
                  <ProductVariantSelector
                    productId={product.id}
                    siblings={siblings}
                    currentSlug={slug}
                  />
                ) : (
                  <AddToCartButton productId={product.id} />
                )}
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
    <Footer />
    </>
  )
}
