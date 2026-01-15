import { createClient } from '@/utils/supabase/server'
import { notFound, redirect } from 'next/navigation'
import EditServiceView from './EditServiceView'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function EditServicePage(props: PageProps) {
    const params = await props.params
    const { id } = params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Fetch Service, Profile, and Availability Settings in parallel
    const [{ data: service }, { data: profile }, { data: availabilitySettings }] = await Promise.all([
        supabase
            .from('services')
            .select('*')
            .eq('id', id)
            .eq('provider_id', user.id)
            .single(),
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

    if (!service) {
        notFound()
    }

    return <EditServiceView service={service} profile={profile} availabilitySettings={availabilitySettings} />
}
