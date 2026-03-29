'use client'

import { useState, useTransition } from 'react'
import { updateProfile } from '@/actions/account'

export function ProfileForm({
  defaultValues,
}: {
  defaultValues: { full_name: string; phone: string }
}) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await updateProfile({
        full_name: fd.get('full_name') as string,
        phone: fd.get('phone') as string,
      })

      if (result.error) setError(result.error)
      else setSaved(true)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      {error && (
        <p className="bg-destructive/10 text-destructive text-sm p-3 rounded">{error}</p>
      )}
      {saved && (
        <p className="text-green-600 text-sm">Saved successfully.</p>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">Full Name</label>
        <input
          name="full_name"
          defaultValue={defaultValues.full_name}
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input
          name="phone"
          type="tel"
          defaultValue={defaultValues.phone}
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
