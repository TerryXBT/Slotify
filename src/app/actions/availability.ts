'use server'

import { createClient } from '@/utils/supabase/server'
import { addMinutes, format, isBefore, parse } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

// Note: Availability interface moved to types/index.ts if needed

export async function getAvailableSlots(
    serviceId: string,
    providerId: string,
    dateString: string, // 'YYYY-MM-DD'
    durationMinutes: number
): Promise<{ slots: string[], error?: string }> {
    const supabase = await createClient()
    const date = new Date(dateString)
    const dayOfWeek = date.getDay() // 0-6 (Sun-Sat)

    // 1. Fetch Availability Rules for this day
    const { data: rules } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('provider_id', providerId)
        .eq('day_of_week', dayOfWeek)

    if (!rules || rules.length === 0) {
        return { slots: [] }
    }

    // 2. Fetch provider timezone and existing bookings
    const { data: profile } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', providerId)
        .single()

    const timeZone = profile?.timezone || 'UTC'

    // Convert the local date to UTC range using date-fns-tz

    // Create start and end of day in provider's timezone
    const startOfDayLocal = toZonedTime(parse(`${dateString} 00:00:00`, 'yyyy-MM-dd HH:mm:ss', new Date()), timeZone)
    const endOfDayLocal = toZonedTime(parse(`${dateString} 23:59:59`, 'yyyy-MM-dd HH:mm:ss', new Date()), timeZone)

    // Convert to UTC for database query
    const startOfDayUTC = fromZonedTime(startOfDayLocal, timeZone)
    const endOfDayUTC = fromZonedTime(endOfDayLocal, timeZone)

    // Fetch all confirmed bookings that overlap with this day
    const { data: bookings } = await supabase
        .from('bookings')
        .select('start_at, end_at')
        .eq('provider_id', providerId)
        .eq('status', 'confirmed')
        .gte('end_at', startOfDayUTC.toISOString())
        .lte('start_at', endOfDayUTC.toISOString())

    // Generate potential slots based on rules
    const slots: string[] = []

    for (const rule of rules) {
        // Parse 'HH:mm:ss' to a Date object on the target date in provider's timezone
        const startTimeParts = rule.start_time_local.split(':').map(Number)
        const endTimeParts = rule.end_time_local.split(':').map(Number)

        // Create dates in provider's timezone
        let currentLocal = new Date(date)
        currentLocal.setHours(startTimeParts[0], startTimeParts[1], startTimeParts[2], 0)

        const endLocal = new Date(date)
        endLocal.setHours(endTimeParts[0], endTimeParts[1], endTimeParts[2], 0)

        while (isBefore(currentLocal, endLocal)) {
            const slotStartLocal = currentLocal
            const slotEndLocal = addMinutes(currentLocal, durationMinutes)

            if (isBefore(slotEndLocal, endLocal) || slotEndLocal.getTime() === endLocal.getTime()) {
                // Convert slot times to UTC for comparison with bookings
                const slotStartUTC = fromZonedTime(slotStartLocal, timeZone)
                const slotEndUTC = fromZonedTime(slotEndLocal, timeZone)

                // Check if this slot conflicts with any existing booking
                const hasConflict = bookings?.some(booking => {
                    const bookingStart = new Date(booking.start_at)
                    const bookingEnd = new Date(booking.end_at)

                    // Check for overlap: slot starts before booking ends AND slot ends after booking starts
                    return slotStartUTC < bookingEnd && slotEndUTC > bookingStart
                })

                if (!hasConflict) {
                    // Slot is available - format it in local time for display
                    slots.push(format(currentLocal, 'h:mma'))
                }
            }
            currentLocal = addMinutes(currentLocal, durationMinutes)
        }
    }

    return { slots }
}

/**
 * Get available slots with full ISO timestamps for reschedule functionality
 */
export async function getAvailableSlotsForReschedule(
    serviceId: string,
    providerId: string,
    dateString: string, // 'YYYY-MM-DD'
    durationMinutes: number,
    excludeBookingId?: string // Exclude specific booking to allow rescheduling to same slot
): Promise<{ slots: Array<{ start: string; end: string }>, error?: string }> {
    const supabase = await createClient()
    const date = new Date(dateString)
    const dayOfWeek = date.getDay() // 0-6 (Sun-Sat)

    // 1. Fetch Availability Rules for this day
    const { data: rules } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('provider_id', providerId)
        .eq('day_of_week', dayOfWeek)

    if (!rules || rules.length === 0) {
        return { slots: [] }
    }

    // 2. Fetch provider timezone and existing bookings
    const { data: profile } = await supabase
        .from('profiles')
        .select('timezone')
        .eq('id', providerId)
        .single()

    const timeZone = profile?.timezone || 'UTC'

    // Create start and end of day in provider's timezone
    const startOfDayLocal = toZonedTime(parse(`${dateString} 00:00:00`, 'yyyy-MM-dd HH:mm:ss', new Date()), timeZone)
    const endOfDayLocal = toZonedTime(parse(`${dateString} 23:59:59`, 'yyyy-MM-dd HH:mm:ss', new Date()), timeZone)

    // Convert to UTC for database query
    const startOfDayUTC = fromZonedTime(startOfDayLocal, timeZone)
    const endOfDayUTC = fromZonedTime(endOfDayLocal, timeZone)

    // Fetch all confirmed bookings that overlap with this day (excluding the booking being rescheduled)
    let query = supabase
        .from('bookings')
        .select('start_at, end_at')
        .eq('provider_id', providerId)
        .eq('status', 'confirmed')
        .gte('end_at', startOfDayUTC.toISOString())
        .lte('start_at', endOfDayUTC.toISOString())

    if (excludeBookingId) {
        query = query.neq('id', excludeBookingId)
    }

    const { data: bookings } = await query

    // Generate potential slots based on rules
    const slots: Array<{ start: string; end: string }> = []

    for (const rule of rules) {
        // Parse 'HH:mm:ss' to a Date object on the target date in provider's timezone
        const startTimeParts = rule.start_time_local.split(':').map(Number)
        const endTimeParts = rule.end_time_local.split(':').map(Number)

        // Create dates in provider's timezone
        let currentLocal = new Date(date)
        currentLocal.setHours(startTimeParts[0], startTimeParts[1], startTimeParts[2], 0)

        const endLocal = new Date(date)
        endLocal.setHours(endTimeParts[0], endTimeParts[1], endTimeParts[2], 0)

        // Use 15-minute intervals for slot generation (more flexible booking options)
        const slotInterval = 15

        while (isBefore(currentLocal, endLocal)) {
            const slotStartLocal = currentLocal
            const slotEndLocal = addMinutes(currentLocal, durationMinutes)

            if (isBefore(slotEndLocal, endLocal) || slotEndLocal.getTime() === endLocal.getTime()) {
                // Convert slot times to UTC for comparison with bookings
                const slotStartUTC = fromZonedTime(slotStartLocal, timeZone)
                const slotEndUTC = fromZonedTime(slotEndLocal, timeZone)

                // Check if this slot conflicts with any existing booking
                const hasConflict = bookings?.some(booking => {
                    const bookingStart = new Date(booking.start_at)
                    const bookingEnd = new Date(booking.end_at)

                    // Check for overlap: slot starts before booking ends AND slot ends after booking starts
                    return slotStartUTC < bookingEnd && slotEndUTC > bookingStart
                })

                if (!hasConflict) {
                    // Slot is available - return ISO timestamps
                    slots.push({
                        start: slotStartUTC.toISOString(),
                        end: slotEndUTC.toISOString()
                    })
                }
            }
            currentLocal = addMinutes(currentLocal, slotInterval)
        }
    }

    return { slots }
}
