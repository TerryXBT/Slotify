'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { emailService } from '@/lib/email/service'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

function generateToken() {
    // Use crypto.randomUUID() for cryptographically secure tokens
    // Remove hyphens to make it URL-friendly and compact
    return crypto.randomUUID().replace(/-/g, '')
}

/**
 * Direct reschedule - provider picks one new time and it's immediately updated
 */
export async function directReschedule(prevState: any, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const bookingId = formData.get('bookingId') as string
    const newStartAt = formData.get('newStartAt') as string // ISO string

    if (!bookingId || !newStartAt) {
        return { error: 'Missing booking ID or new time' }
    }

    // Verify ownership of booking and get full details
    const { data: booking } = await supabase
        .from('bookings')
        .select('*, services(name, duration_minutes), profiles!bookings_provider_id_fkey(full_name, timezone)')
        .eq('id', bookingId)
        .single()

    if (!booking || booking.provider_id !== user.id) {
        return { error: 'Booking not found or access denied' }
    }

    // Calculate new end time
    const servicesData = booking.services as any
    const duration = (Array.isArray(servicesData) ? servicesData[0]?.duration_minutes : servicesData?.duration_minutes) || 30
    const serviceName = (Array.isArray(servicesData) ? servicesData[0]?.name : servicesData?.name) || 'Service'

    const startDate = new Date(newStartAt)
    const endDate = new Date(startDate.getTime() + duration * 60000)

    // Update booking
    const { error: updateError } = await supabase
        .from('bookings')
        .update({
            start_at: startDate.toISOString(),
            end_at: endDate.toISOString(),
            status: 'confirmed'
        })
        .eq('id', bookingId)

    if (updateError) {
        console.error('Failed to update booking:', updateError)
        return { error: 'Failed to reschedule booking' }
    }

    // Send confirmation email to client
    if (booking.client_email) {
        try {
            const profilesData = booking.profiles as any
            const timezone = (Array.isArray(profilesData) ? profilesData[0]?.timezone : profilesData?.timezone) || 'UTC'
            const providerName = (Array.isArray(profilesData) ? profilesData[0]?.full_name : profilesData?.full_name) || 'Your Provider'

            const zonedDate = toZonedTime(startDate, timezone)
            const formattedDate = format(zonedDate, 'EEEE, MMMM d, yyyy \'at\' h:mm a')

            await emailService.sendRescheduleConfirmation(
                booking.client_email,
                booking.client_name,
                serviceName,
                formattedDate,
                providerName
            )
        } catch (emailError) {
            console.error('Failed to send reschedule confirmation email:', emailError)
            // Don't fail the entire operation if email fails
        }
    }

    redirect(`/app/bookings/${bookingId}?rescheduled=true`)
}

/**
 * Original proposal-based reschedule (kept for backward compatibility)
 */
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
