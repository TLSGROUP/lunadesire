import { RegisterForm } from '@/components/shop/RegisterForm'
import Link from 'next/link'

export const metadata = { title: 'Create Account' }

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#07030b]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="text-xs tracking-widest uppercase text-[#d4006e] mb-4">Join Us</p>
          <h1 className="font-serif text-3xl text-[#f2ede8]">Create Account</h1>
        </div>

        <RegisterForm />

        <div className="mt-8 text-center">
          <p className="text-xs text-[#4a4448]">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-[#d4006e] hover:text-[#d4b030] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
