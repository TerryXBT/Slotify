import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import CreateServiceView from './CreateServiceView'

export default async function NewServicePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const [{ data: profile }, { data: availabilitySettings }] = await Promise.all([
        supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single(),
        supabase
            .from('availability_settings')
            .select('default_buffer_minutes, default_cancellation_policy')
            .eq('provider_id', user.id)
            .single()
    ])

    return <CreateServiceView profile={profile} availabilitySettings={availabilitySettings} />
}
