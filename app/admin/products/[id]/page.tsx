import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { EditProductForm } from '@/components/admin/EditProductForm'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('products').select('name').eq('id', id).single()
  return { title: data ? `Edit: ${data.name}` : 'Edit Product' }
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (!product) notFound()

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">Edit Product</h1>
      <EditProductForm product={product} />
    </div>
  )
}
