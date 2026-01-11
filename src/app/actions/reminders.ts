'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { emailService } from '@/lib/email/service'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

// Types for Supabase join data
interface ServiceData {
    name?: string
    default_location?: string | null
}

interface ProfileData {
    full_name?: string | null
    timezone?: string
}

/**
 * Send booking reminders for appointments happening in 24 hours
 * This function should be called by a cron job daily
 *
 * Usage: Set up a cron job or scheduled task to call this function
 * - Vercel Cron: Configure in vercel.json
 * - Manual: Create an API route that calls this function
 */
export async function sendBookingReminders() {
    const admin = createAdminClient()

    // Calculate 24 hours from now
    const now = new Date()
    const reminderWindowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000) // 23 hours
    const reminderWindowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000) // 25 hours

    // Fetch all confirmed bookings in the next 24 hours that have client emails
    const { data: bookings, error } = await admin
        .from('bookings')
        .select(`
            id,
            start_at,
            client_name,
            client_email,
            services(name, default_location),
            profiles(full_name, timezone)
        `)
        .eq('status', 'confirmed')
        .not('client_email', 'is', null)
        .gte('start_at', reminderWindowStart.toISOString())
        .lte('start_at', reminderWindowEnd.toISOString())

    if (error) {
        console.error('[REMINDERS] Error fetching bookings:', error)
        return { error: error.message, sent: 0 }
    }

    if (!bookings || bookings.length === 0) {
        return { sent: 0, message: 'No bookings to remind' }
    }

    let successCount = 0
    let failureCount = 0

    // Send reminders
    for (const booking of bookings) {
        try {
            const service = booking.services as ServiceData | ServiceData[] | null
            const profile = booking.profiles as ProfileData | ProfileData[] | null

            const serviceName = (Array.isArray(service) ? service[0]?.name : service?.name) || 'Your Appointment'
            const providerName = (Array.isArray(profile) ? profile[0]?.full_name : profile?.full_name) || 'Provider'
            const timezone = (Array.isArray(profile) ? profile[0]?.timezone : profile?.timezone) || 'UTC'
            const location = (Array.isArray(service) ? service[0]?.default_location : service?.default_location)

            // Format date in provider's timezone
            const zonedDate = toZonedTime(new Date(booking.start_at), timezone)
            const formattedDate = format(zonedDate, 'EEEE, MMMM d, yyyy \'at\' h:mm a zzz')

            await emailService.sendBookingReminder(
                booking.client_email!,
                booking.client_name,
                serviceName,
                formattedDate,
                providerName,
                location ?? undefined
            )

            successCount++
        } catch (error) {
            failureCount++
            console.error(`[REMINDERS] ❌ Failed to send reminder for booking ${booking.id}:`, error)
        }
    }

    return {
        sent: successCount,
        failed: failureCount,
        total: bookings.length
    }
}
