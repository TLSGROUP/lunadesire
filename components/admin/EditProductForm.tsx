'use client'

import { useState, useTransition } from 'react'
import { updateProduct } from '@/actions/admin/products'

interface Product {
  id: string
  name: string
  description: string | null
  markup_pct: number
  retail_price: number
  supplier_price: number
  is_active: boolean
}

export function EditProductForm({ product }: { product: Product }) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateProduct(product.id, {
        description: fd.get('description') as string,
        markup_pct: parseFloat(fd.get('markup_pct') as string),
      })

      if (result.error) setError(result.error)
      else setSaved(true)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="bg-destructive/10 text-destructive text-sm p-3 rounded">{error}</p>
      )}
      {saved && <p className="text-green-600 text-sm">Saved.</p>}

      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <p className="text-sm text-muted-foreground">{product.name}</p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Supplier Price</label>
        <p className="text-sm text-muted-foreground">{product.supplier_price} EUR</p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Markup %</label>
        <input
          name="markup_pct"
          type="number"
          step="0.1"
          min="0"
          defaultValue={product.markup_pct}
          className="w-full border rounded px-3 py-2 text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Retail price recalculated automatically on save.
        </p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          name="description"
          defaultValue={product.description ?? ''}
          rows={5}
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {isPending ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  )
}
