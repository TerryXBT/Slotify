'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// Pro cancels directly
export async function cancelBookingAsPro(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Not authenticated')

    const bookingId = formData.get('bookingId') as string
    if (!bookingId) throw new Error('Missing booking ID')

    // Verify ownership
    const { data: booking } = await supabase.from('bookings').select('provider_id').eq('id', bookingId).single()

    if (!booking || booking.provider_id !== user.id) {
        throw new Error('Access denied')
    }

    const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)

    if (error) {
        console.error(error)
        throw new Error('Failed to cancel booking')
    }

    revalidatePath('/app/today')
    revalidatePath(`/app/bookings/${bookingId}`)
    redirect('/app/today')
}

// Client cancels via token
export async function cancelBookingViaToken(token: string) {
    const supabase = await createClient()

    // 1. Verify Token
    const { data: actionToken } = await supabase
        .from('action_tokens')
        .select('*, bookings(provider_id)')
        .eq('token', token)
        .eq('type', 'cancel')
        .single()

    // Note: bookings relationship data is accessed but not currently used
    // The token is validated by checking if it exists and is not expired

    if (!actionToken || new Date(actionToken.expires_at) < new Date()) {
        return { error: 'Invalid or expired token' }
    }

    // 2. Update Booking
    const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', actionToken.booking_id)

    if (error) return { error: 'Failed to cancel' }

    // 3. Delete Token (One-time use)
    await supabase.from('action_tokens').delete().eq('token', token)

    return { success: true }
}
