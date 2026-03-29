'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email: fd.get('email') as string,
        password: fd.get('password') as string,
        options: {
          data: { full_name: fd.get('full_name') as string },
          emailRedirectTo: `${location.origin}/api/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        router.push('/auth/login?message=check-email')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="bg-destructive/10 text-destructive text-sm p-3 rounded">{error}</p>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">Full Name</label>
        <input
          name="full_name"
          required
          autoComplete="name"
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-primary text-primary-foreground py-2.5 rounded font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
      >
        {isPending ? 'Creating account…' : 'Create Account'}
      </button>
    </form>
  )
}
