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
      <h2 className="font-serif text-2xl text-gray-900 mb-8">Profile</h2>
      <div className="space-y-4">
        {[
          { label: 'Name', value: profile?.full_name ?? '—' },
          { label: 'Email', value: profile?.email },
          { label: 'Phone', value: profile?.phone ?? '—' },
          { label: 'Member since', value: new Date(profile?.created_at).toLocaleDateString('en') },
        ].map(({ label, value }) => (
          <div key={label} className="flex border-b border-gray-200 pb-4">
            <span className="text-xs tracking-widest uppercase text-gray-500 w-32 shrink-0 pt-0.5">{label}</span>
            <span className="text-sm text-gray-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
