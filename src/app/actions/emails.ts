'use server'

import { emailService } from '@/lib/email/service'
import { createAdminClient } from '@/utils/supabase/admin'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

// Types for Supabase join data
interface ServiceData {
    name?: string
}

interface ProfileData {
    full_name?: string | null
    timezone?: string
}

export async function sendConfirmationEmail(bookingId: string, cancelToken?: string) {

    const admin = createAdminClient()

    const { data: booking, error: fetchError } = await admin
        .from('bookings')
        .select('*, services(name), profiles(full_name, timezone)')
        .eq('id', bookingId)
        .single()

    if (fetchError) {
        console.error('[EMAIL] Failed to fetch booking:', fetchError)
        return
    }

    if (!booking) {
        console.error('[EMAIL] Booking not found for email')
        return
    }

    if (!booking.client_email) {
        console.warn('[EMAIL] No client email for booking', bookingId)
        return
    }

    // Construct cancel link if token is provided
    let cancelLink: string | undefined
    if (cancelToken) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        cancelLink = `${baseUrl}/cancel/${cancelToken}`
    }

    const servicesData = booking.services as ServiceData | ServiceData[] | null
    const serviceName = (Array.isArray(servicesData) ? servicesData[0]?.name : servicesData?.name) || 'Your Appointment'
    const profilesData = booking.profiles as ProfileData | ProfileData[] | null
    const providerName = (Array.isArray(profilesData) ? profilesData[0]?.full_name : profilesData?.full_name) || 'Provider'
    const timezone = (Array.isArray(profilesData) ? profilesData[0]?.timezone : profilesData?.timezone) || 'UTC'

    // Format date in provider's timezone
    const zonedDate = toZonedTime(new Date(booking.start_at), timezone)
    const formattedDate = format(zonedDate, 'EEEE, MMMM d, yyyy \'at\' h:mm a zzz')

    try {
        await emailService.sendBookingConfirmation(
            booking.client_email,
            booking.client_name,
            serviceName,
            formattedDate,
            providerName,
            cancelLink
        )
    } catch (error) {
        console.error('[EMAIL] ❌ Failed to send email:', error)
        throw error
    }
}
