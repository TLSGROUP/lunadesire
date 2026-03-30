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
        <p className="border border-[#8b1a3a] text-[#e07070] text-xs p-3 tracking-wide">{error}</p>
      )}
      {saved && (
        <p className="text-xs tracking-widest uppercase text-emerald-500">Saved successfully.</p>
      )}
      <div>
        <label className="block text-xs tracking-widest uppercase text-[#7a7078] mb-2">Full Name</label>
        <input
          name="full_name"
          defaultValue={defaultValues.full_name}
          className="w-full bg-[#0d080f] border border-[#1e181d] text-[#f2ede8] px-4 py-3 text-sm focus:outline-none focus:border-[#c5a028] transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs tracking-widest uppercase text-[#7a7078] mb-2">Phone</label>
        <input
          name="phone"
          type="tel"
          defaultValue={defaultValues.phone}
          className="w-full bg-[#0d080f] border border-[#1e181d] text-[#f2ede8] px-4 py-3 text-sm focus:outline-none focus:border-[#c5a028] transition-colors"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="border border-[#c5a028] text-[#c5a028] px-8 py-3 text-xs tracking-widest uppercase hover:bg-[#c5a028] hover:text-black disabled:opacity-40 transition-colors duration-300"
      >
        {isPending ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  )
}
