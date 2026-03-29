import { ResetPasswordForm } from '@/components/shop/ResetPasswordForm'
import Link from 'next/link'

export const metadata = { title: 'Reset Password' }

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center">Reset Password</h1>
        <ResetPasswordForm />
        <p className="text-center text-sm">
          <Link href="/auth/login" className="text-muted-foreground hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
