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
  return { title: data.name, description: data.description?.slice(0, 160) }
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
          {primaryImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryImage}
              alt={product.name}
              className="w-full rounded-lg object-contain bg-muted aspect-square"
            />
          ) : (
            <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
          <div className="grid grid-cols-4 gap-2 mt-2">
            {images.slice(1, 5).map((img, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={img}
                alt={`${product.name} ${i + 2}`}
                className="w-full aspect-square object-cover rounded bg-muted"
              />
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-4">
          {product.brand && (
            <p className="text-sm text-muted-foreground uppercase tracking-wide">
              {product.brand}
            </p>
          )}
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="text-3xl font-bold">{formatPrice(product.retail_price)}</p>

          <p className={product.stock_quantity > 0 ? 'text-green-600' : 'text-destructive'}>
            {product.stock_quantity > 0 ? 'In stock' : 'Out of stock'}
          </p>

          {product.stock_quantity > 0 && (
            <AddToCartButton productId={product.id} />
          )}

          {product.description && (
            <div className="prose prose-sm max-w-none mt-4">
              <p>{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
