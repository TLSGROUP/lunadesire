'use client'

import { useState, useTransition } from 'react'
import { submitOrderToDreamLove } from '@/actions/admin/orders'

export function SubmitToDreamLoveButton({ orderId }: { orderId: string }) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)

  function handleSubmit() {
    startTransition(async () => {
      const r = await submitOrderToDreamLove(orderId)
      setResult(r)
    })
  }

  if (result?.success) {
    return <p className="text-green-600 text-sm">Order submitted to DreamLove.</p>
  }

  return (
    <div className="space-y-2">
      {result?.error && (
        <p className="text-destructive text-sm">{result.error}</p>
      )}
      <button
        disabled={isPending}
        onClick={handleSubmit}
        className="bg-primary text-primary-foreground px-4 py-2 rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {isPending ? 'Submitting…' : 'Submit to DreamLove'}
      </button>
    </div>
  )
}
