import { LoginForm } from '@/components/shop/LoginForm'
import Link from 'next/link'

export const metadata = { title: 'Sign In' }

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#07030b]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="text-xs tracking-widest uppercase text-[#c5a028] mb-4">Welcome Back</p>
          <h1 className="font-serif text-3xl text-[#f2ede8]">Sign In</h1>
        </div>

        <LoginForm />

        <div className="mt-8 space-y-3 text-center">
          <p className="text-xs text-[#4a4448]">
            No account?{' '}
            <Link href="/auth/register" className="text-[#c5a028] hover:text-[#d4b030] transition-colors">
              Create one
            </Link>
          </p>
          <p className="text-xs">
            <Link href="/auth/reset-password" className="text-[#4a4448] hover:text-[#7a7078] transition-colors">
              Forgot password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
