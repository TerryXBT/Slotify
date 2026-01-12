import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AvailabilityTab from '../AvailabilityTab'

export default async function AvailabilityPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: availabilityRules } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('provider_id', user.id)
        .order('day_of_week')

    return (
        <div className="min-h-screen bg-[#1a1a1a]">
            <AvailabilityTab availabilityRules={availabilityRules || []} />
        </div>
    )
}
