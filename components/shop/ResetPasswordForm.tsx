'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ResetPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(
        fd.get('email') as string,
        { redirectTo: `${location.origin}/api/auth/callback?next=/account/settings` },
      )

      if (error) setError(error.message)
      else setSent(true)
    })
  }

  if (sent) {
    return (
      <p className="text-center text-xs text-[#7a7078] tracking-wide">
        Check your email for a password reset link.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="border border-[#8b1a3a] text-[#e07070] text-xs p-3 tracking-wide">{error}</p>
      )}
      <div>
        <label className="block text-xs tracking-widest uppercase text-gray-500 mb-2">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full bg-white border border-gray-300 text-gray-900 px-4 py-3 text-sm focus:outline-none focus:border-[#d4006e] transition-colors"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#d4006e] text-white py-4 text-xs tracking-widest uppercase hover:bg-[#b8005e] disabled:opacity-40 transition-colors duration-300 mt-2"
      >
        {isPending ? 'Sending…' : 'Send Reset Link'}
      </button>
    </form>
  )
}
