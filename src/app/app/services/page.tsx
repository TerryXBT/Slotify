import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ServicesView from './ServicesView'

export default async function ServicesPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Fetch Active Services (not deleted)
    const { data: services } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', user.id)
        .is('deleted_at', null)
        .order('created_at')

    // Fetch Deleted Services (in trash)
    const { data: deletedServices } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', user.id)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })

    // Fetch availability rules
    const { data: availabilityRules } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('provider_id', user.id)
        .order('day_of_week')

    return <ServicesView
        profile={profile}
        services={services || []}
        deletedServices={deletedServices || []}
        availabilityRules={availabilityRules || []}
    />
}
