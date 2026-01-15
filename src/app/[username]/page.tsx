import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import BookingFlow from '@/components/BookingFlow'

// Since we are using standard fetch in createClient (if configured) or just native fetch, 
// caching is automatic in App Router unless opted out. 
// For Profile/Services it's good to cache but maybe revalidate often?
// Default is force-cache. 
// We might want `export const revalidate = 60` or similar.

export default async function BookingPage({
    params,
    searchParams,
}: {
    params: Promise<{ username: string }>
    searchParams: Promise<{ service?: string }>
}) {
    const { username } = await params
    const { service: serviceId } = await searchParams
    const supabase = await createClient()

    // 1. Get Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, username, full_name')
        .eq('username', username)
        .single()

    if (!profile) {
        return notFound()
    }

    // 2. Get Services (active and not deleted)
    // If serviceId is provided, only fetch that specific service (for privacy and direct booking)
    let servicesQuery = supabase
        .from('services')
        .select('id, name, duration_minutes, price_cents, price_negotiable, description, location_type, default_location, cancellation_policy')
        .eq('provider_id', profile.id)
        .eq('is_active', true)
        .is('deleted_at', null)

    if (serviceId) {
        // Only fetch the specific service when accessing via direct link
        servicesQuery = servicesQuery.eq('id', serviceId)
    }

    const { data: services } = await servicesQuery.order('created_at', { ascending: true })

    return (
        <main className="min-h-screen bg-[#1e293b] font-sans p-4 sm:p-8">
            <BookingFlow
                profile={profile}
                services={services || []}
                preSelectedServiceId={serviceId}
            />
        </main>
    )
}
