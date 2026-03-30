import { createClient } from '@/lib/supabase/server'
import { ProfileForm } from '@/components/shop/ProfileForm'

export const metadata = { title: 'Account Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user!.id)
    .single()

  return (
    <div>
      <h2 className="font-serif text-2xl text-[#f2ede8] mb-8">Settings</h2>
      <ProfileForm
        defaultValues={{ full_name: profile?.full_name ?? '', phone: profile?.phone ?? '' }}
      />
    </div>
  )
}
