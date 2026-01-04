'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { startOfDay, endOfDay, addDays } from 'date-fns'

export async function getCalendarEvents(dateStr: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const adminClient = createAdminClient()

    const targetDate = new Date(dateStr)
    // Safe Range: Fetch +/- 2 days to cover ALL timezone offsets
    const start = addDays(startOfDay(targetDate), -2).toISOString()
    const end = addDays(endOfDay(targetDate), 2).toISOString()

    // Fetch Bookings (Using Admin Client + Left Join to ensure data availability)
    const { data: bookings } = await adminClient
        .from('bookings')
        .select(`
            id, 
            status, 
            start_at, 
            end_at, 
            client_name, 
            services!left(name, color)
        `)
        .eq('provider_id', user.id)
    // .gte('start_at', start)
    // .lte('start_at', end)
    // .neq('status', 'cancelled')

    // Fetch Busy Blocks
    const { data: busyBlocks } = await adminClient
        .from('busy_blocks')
        .select('*')
        .eq('provider_id', user.id)
        .gte('start_at', start)
        .lte('start_at', end)

    return {
        bookings: bookings || [],
        busyBlocks: busyBlocks || []
    }
}
