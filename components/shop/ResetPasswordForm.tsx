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
      <p className="text-center text-sm text-muted-foreground">
        Check your email for a password reset link.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="bg-destructive/10 text-destructive text-sm p-3 rounded">{error}</p>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary text-primary-foreground py-2.5 rounded font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {isPending ? 'Sending…' : 'Send Reset Link'}
      </button>
    </form>
  )
}
