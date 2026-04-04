import { ResetPasswordForm } from '@/components/shop/ResetPasswordForm'
import Link from 'next/link'

export const metadata = { title: 'Reset Password' }

interface Props {
  params: Promise<{ locale: string }>
}

export default async function ResetPasswordPage({ params }: Props) {
  const { locale } = await params
  const base = `/${locale}`

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="text-xs tracking-widest uppercase text-[#d4006e] mb-4">Account</p>
          <h1 className="font-serif text-3xl text-gray-900">Reset Password</h1>
        </div>

        <ResetPasswordForm />

        <div className="mt-8 text-center">
          <Link href={`${base}/auth/login`} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
