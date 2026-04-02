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
        <p className="border border-[#8b1a3a] text-[#e07070] text-xs p-3 tracking-wide">{error}</p>
      )}
      <div>
        <label className="block text-xs tracking-widest uppercase text-[#7a7078] mb-2">Full Name</label>
        <input
          name="full_name"
          required
          autoComplete="name"
          className="w-full bg-[#0d080f] border border-[#1e181d] text-[#f2ede8] px-4 py-3 text-sm focus:outline-none focus:border-[#d4006e] transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs tracking-widest uppercase text-[#7a7078] mb-2">Email</label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full bg-[#0d080f] border border-[#1e181d] text-[#f2ede8] px-4 py-3 text-sm focus:outline-none focus:border-[#d4006e] transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs tracking-widest uppercase text-[#7a7078] mb-2">Password</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className="w-full bg-[#0d080f] border border-[#1e181d] text-[#f2ede8] px-4 py-3 text-sm focus:outline-none focus:border-[#d4006e] transition-colors"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-[#8b1a3a] text-white py-4 text-xs tracking-widest uppercase hover:bg-[#a82148] disabled:opacity-40 transition-colors duration-300 mt-2"
      >
        {isPending ? 'Creating account…' : 'Create Account'}
      </button>
    </form>
  )
}
