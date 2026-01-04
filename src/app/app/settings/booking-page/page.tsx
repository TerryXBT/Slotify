import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import BookingPageForm from './BookingPageForm'

export default async function BookingPageSettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) {
        redirect('/app/today')
    }

    return <BookingPageForm profile={profile} />
}
