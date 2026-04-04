import { RegisterForm } from '@/components/shop/RegisterForm'
import Link from 'next/link'

export const metadata = { title: 'Create Account' }

interface Props {
  params: Promise<{ locale: string }>
}

export default async function RegisterPage({ params }: Props) {
  const { locale } = await params
  const base = `/${locale}`

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <p className="text-xs tracking-widest uppercase text-[#d4006e] mb-4">Join Us</p>
          <h1 className="font-serif text-3xl text-gray-900">Create Account</h1>
        </div>

        <RegisterForm />

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Already have an account?{' '}
            <Link href={`${base}/auth/login`} className="text-[#d4006e] hover:text-[#b8005e] transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
