import { createClient } from '@/lib/supabase/server'
import { ProductGrid } from '@/components/shop/ProductGrid'

export const metadata = { title: 'Home' }

export default async function HomePage() {
  const supabase = await createClient()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, retail_price, images, brand, stock_quantity')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(24)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Featured Products</h1>
      <ProductGrid products={products ?? []} />
    </div>
  )
}
