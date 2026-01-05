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

    // Fetch Service
    const { data: service } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .eq('provider_id', user.id)
        .single()

    if (!service) {
        notFound()
    }

    // Fetch Profile for back navigation context if needed
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return <EditServiceView service={service} profile={profile} />
}
