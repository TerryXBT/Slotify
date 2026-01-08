'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { emailService } from '@/lib/email/service'

function generateToken() {
    // Simple random string for P0
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export async function createRescheduleProposal(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const bookingId = formData.get('bookingId') as string
    const dates = formData.getAll('date') as string[]
    const times = formData.getAll('time') as string[]

    if (!bookingId || dates.length === 0) {
        return { error: 'Please select at least one slot' }
    }

    // Verify ownership of booking and get client info
    const { data: booking } = await supabase
        .from('bookings')
        .select('provider_id, service_id, client_name, client_email, services(duration_minutes)')
        .eq('id', bookingId)
        .single()

    if (!booking || booking.provider_id !== user.id) {
        return { error: 'Booking not found or access denied' }
    }

    if (!booking.client_email) {
        return { error: 'Cannot send reschedule request: client email not found' }
    }

    // Supabase join weirdness: services might be array or object
    const servicesData = booking.services as any
    const duration = (Array.isArray(servicesData) ? servicesData[0]?.duration_minutes : servicesData?.duration_minutes) || 30
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days

    // 1. Create Proposal
    const { data: proposal, error: propError } = await supabase
        .from('reschedule_proposals')
        .insert({
            booking_id: bookingId,
            provider_id: user.id,
            token: token,
            expires_at: expiresAt,
            status: 'active'
        })
        .select()
        .single()

    if (propError || !proposal) {
        console.error(propError)
        return { error: 'Failed to create proposal' }
    }

    // 2. Create Options
    const options = dates.map((date, index) => {
        const time = times[index]
        const startAt = new Date(`${date}T${time}:00`)
        const endAt = new Date(startAt.getTime() + duration * 60000)

        return {
            proposal_id: proposal.id,
            start_at: startAt.toISOString(),
            end_at: endAt.toISOString()
        }
    })

    const { error: optError } = await supabase.from('reschedule_options').insert(options)

    if (optError) {
        console.error(optError)
        return { error: 'Failed to save options' }
    }

    // 3. Update Booking Status -> 'pending_reschedule'
    await supabase.from('bookings').update({ status: 'pending_reschedule' }).eq('id', bookingId)

    // 4. Send reschedule proposal email to client
    try {
        const rescheduleLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reschedule/${token}`
        await emailService.sendRescheduleProposal(
            booking.client_email,
            booking.client_name,
            rescheduleLink
        )
    } catch (emailError) {
        console.error('Failed to send reschedule email:', emailError)
        // Don't fail the entire operation if email fails
    }

    // Redirect to a "Success/Share" page
    redirect(`/app/bookings/${bookingId}?reschedule_token=${token}`)
}
