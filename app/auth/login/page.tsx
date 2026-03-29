import { LoginForm } from '@/components/shop/LoginForm'
import Link from 'next/link'

export const metadata = { title: 'Sign In' }

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center">Sign In</h1>
        <LoginForm />
        <p className="text-center text-sm text-muted-foreground">
          No account?{' '}
          <Link href="/auth/register" className="text-primary hover:underline">
            Create one
          </Link>
        </p>
        <p className="text-center text-sm">
          <Link href="/auth/reset-password" className="text-muted-foreground hover:underline">
            Forgot password?
          </Link>
        </p>
      </div>
    </div>
  )
}
