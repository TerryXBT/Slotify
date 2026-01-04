'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function updateAvailability(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // We expect inputs like 'day_1_start', 'day_1_end', 'day_1_active'
    const rules = []

    // Clean existing rules first? Or upsert?
    // Easiest for P0: DELETE all for provider and INSERT new. 
    // (Naive but effective for full form submission)

    // 1. Delete all current rules
    await supabase.from('availability_rules').delete().eq('provider_id', user.id)

    const days = [0, 1, 2, 3, 4, 5, 6] // Sun-Sat

    for (const day of days) {
        const isActive = formData.get(`day_${day}_active`) === 'on'
        if (isActive) {
            const start = formData.get(`day_${day}_start`) as string
            const end = formData.get(`day_${day}_end`) as string

            if (start && end) {
                await supabase.from('availability_rules').insert({
                    provider_id: user.id,
                    day_of_week: day,
                    start_time_local: start,
                    end_time_local: end
                })
            }
        }
    }

    revalidatePath('/app/today')
    redirect('/app/today')
}
