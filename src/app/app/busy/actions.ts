'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createBusyBlock(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const date = formData.get('date') as string
    const startTime = formData.get('startTime') as string
    const endTime = formData.get('endTime') as string
    const title = formData.get('title') as string

    // Combine date and time to ISO strings
    // Note: Inputs are local time. We need to store as ISO.
    // Ideally we should know the user's timezone to construct the offset,
    // but for P0 MVP we often rely on browser sending ISO or UTC.
    // BETTER: Let's assume the user enters "2023-10-24" and "10:00".
    // If we just do `new Date("2023-10-24T10:00")`, server might interpret in UTC or local server time.
    // **Crucial**: DB `timestamptz` expects absolute time.
    // For P0, let's construct it assuming the Server and Client are roughly aligned or rely on a helper if possible.
    // Or, we accept the raw strings and cast to timestamptz in Postgres if the user session timezone was set.
    // Let's do simple string construction for now: `${date}T${startTime}:00`

    const startAt = new Date(`${date}T${startTime}:00`)
    const endAt = new Date(`${date}T${endTime}:00`)

    const { error } = await supabase.from('busy_blocks').insert({
        provider_id: user.id,
        start_at: startAt.toISOString(),
        end_at: endAt.toISOString(),
        title: title || 'Busy'
    })

    if (error) {
        console.error(error)
        // return { error: 'Failed to create busy block' } // Cannot return data in standard form action without useFormState
        throw new Error('Failed to create busy block')
    }

    revalidatePath('/app/today')
    redirect('/app/today')
}
