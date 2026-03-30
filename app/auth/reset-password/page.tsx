import { ResetPasswordForm } from '@/components/shop/ResetPasswordForm'
import Link from 'next/link'

export const metadata = { title: 'Reset Password' }

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#07030b]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="text-xs tracking-widest uppercase text-[#c5a028] mb-4">Account</p>
          <h1 className="font-serif text-3xl text-[#f2ede8]">Reset Password</h1>
        </div>

        <ResetPasswordForm />

        <div className="mt-8 text-center">
          <Link href="/auth/login" className="text-xs text-[#4a4448] hover:text-[#7a7078] transition-colors">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
