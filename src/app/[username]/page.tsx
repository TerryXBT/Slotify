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
    const { data: services } = await supabase
        .from('services')
        .select('id, name, duration_minutes, price_cents')
        .eq('provider_id', profile.id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-black font-sans text-gray-900 dark:text-gray-100 p-4 sm:p-8">
            <BookingFlow
                profile={profile}
                services={services || []}
                preSelectedServiceId={serviceId}
            />
        </main>
    )
}
