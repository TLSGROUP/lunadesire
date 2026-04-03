import { LoginForm } from '@/components/shop/LoginForm'
import Link from 'next/link'

export const metadata = { title: 'Sign In' }

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="text-xs tracking-widest uppercase text-[#d4006e] mb-4">Welcome Back</p>
          <h1 className="font-serif text-3xl text-gray-900">Sign In</h1>
        </div>

        <LoginForm />

        <div className="mt-8 space-y-3 text-center">
          <p className="text-xs text-gray-400">
            No account?{' '}
            <Link href="/auth/register" className="text-[#d4006e] hover:text-[#b8005e] transition-colors">
              Create one
            </Link>
          </p>
          <p className="text-xs">
            <Link href="/auth/reset-password" className="text-gray-400 hover:text-gray-600 transition-colors">
              Forgot password?
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
