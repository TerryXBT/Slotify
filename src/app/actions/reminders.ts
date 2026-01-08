'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { emailService } from '@/lib/email/service'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

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

    console.log('[REMINDERS] Checking for bookings between:', {
        start: reminderWindowStart.toISOString(),
        end: reminderWindowEnd.toISOString()
    })

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
        console.log('[REMINDERS] No bookings found for reminders')
        return { sent: 0, message: 'No bookings to remind' }
    }

    console.log(`[REMINDERS] Found ${bookings.length} booking(s) to remind`)

    let successCount = 0
    let failureCount = 0

    // Send reminders
    for (const booking of bookings) {
        try {
            const service = booking.services as any
            const profile = booking.profiles as any

            const serviceName = (Array.isArray(service) ? service[0]?.name : service?.name) || 'Your Appointment'
            const providerName = (Array.isArray(profile) ? profile[0]?.full_name : profile?.full_name) || 'Provider'
            const timezone = (Array.isArray(profile) ? profile[0]?.timezone : profile?.timezone) || 'UTC'
            const location = (Array.isArray(service) ? service[0]?.default_location : service?.default_location)

            // Format date in provider's timezone
            const zonedDate = toZonedTime(new Date(booking.start_at), timezone)
            const formattedDate = format(zonedDate, 'EEEE, MMMM d, yyyy \'at\' h:mm a zzz')

            console.log(`[REMINDERS] Sending reminder to ${booking.client_email} for booking ${booking.id}`)

            await emailService.sendBookingReminder(
                booking.client_email!,
                booking.client_name,
                serviceName,
                formattedDate,
                providerName,
                location
            )

            successCount++
            console.log(`[REMINDERS] ✅ Reminder sent to ${booking.client_email}`)
        } catch (error) {
            failureCount++
            console.error(`[REMINDERS] ❌ Failed to send reminder for booking ${booking.id}:`, error)
        }
    }

    console.log(`[REMINDERS] Complete: ${successCount} sent, ${failureCount} failed`)

    return {
        sent: successCount,
        failed: failureCount,
        total: bookings.length
    }
}
