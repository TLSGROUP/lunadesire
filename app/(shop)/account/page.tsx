import { createClient } from '@/lib/supabase/server'

export const metadata = { title: 'My Account' }

export default async function AccountPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, phone, created_at')
    .eq('id', user!.id)
    .single()

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Account</h1>
      <div className="space-y-3 text-sm">
        <p>
          <span className="font-medium">Name:</span> {profile?.full_name ?? '—'}
        </p>
        <p>
          <span className="font-medium">Email:</span> {profile?.email}
        </p>
        <p>
          <span className="font-medium">Phone:</span> {profile?.phone ?? '—'}
        </p>
        <p>
          <span className="font-medium">Member since:</span>{' '}
          {new Date(profile?.created_at).toLocaleDateString('en')}
        </p>
      </div>
    </div>
  )
}
