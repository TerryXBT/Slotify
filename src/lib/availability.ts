
import { createAdminClient } from '@/utils/supabase/admin'
import { addMinutes, isBefore, getDay } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'

type Slot = {
    start: string // ISO string
    end: string
}

export async function getAvailableSlots(
    username: string,
    serviceId: string,
    date: string // YYYY-MM-DD
): Promise<Slot[]> {
    const supabase = createAdminClient()

    // 1. Get Profile first (needed for subsequent queries)
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, timezone')
        .eq('username', username)
        .single()

    if (profileError || !profile) {
        console.error('Profile fetch error:', profileError)
        throw new Error('Provider not found')
    }

    // 2. Fetch settings and service in parallel (no dependency on each other)
    const [settingsResult, serviceResult] = await Promise.all([
        supabase
            .from('availability_settings')
            .select('*')
            .eq('provider_id', profile.id)
            .single(),
        supabase
            .from('services')
            .select('duration_minutes')
            .eq('id', serviceId)
            .single()
    ])

    const { data: settings } = settingsResult
    const { data: service } = serviceResult

    if (!service) throw new Error('Service not found')

    const timezone = profile.timezone || 'UTC'
    const duration = service.duration_minutes
    const bufferBefore = settings?.buffer_before_minutes || 0
    const bufferAfter = settings?.buffer_after_minutes || 0
    const minNotice = settings?.min_notice_minutes || 120

    // 4. Determine Day of Week & Fetch Rules
    const queryDate = fromZonedTime(`${date}T00:00:00`, timezone)

    // getDay returns 0-6 (Sun-Sat) which matches our DB
    // We need the day in the Provider's timezone
    const targetDateZoned = toZonedTime(queryDate, timezone)
    const targetDayOfWeek = getDay(targetDateZoned)

    const { data: rules } = await supabase
        .from('availability_rules')
        .select('*')
        .eq('provider_id', profile.id)
        .eq('day_of_week', targetDayOfWeek)

    if (!rules || rules.length === 0) return []

    // 5. Construct Potential Windows (in UTC)
    const windows: { start: Date; end: Date }[] = []

    for (const rule of rules) {
        const startString = `${date}T${rule.start_time_local}`
        const endString = `${date}T${rule.end_time_local}`

        // Parse as Zoned Time
        const startZoned = fromZonedTime(startString, timezone)
        const endZoned = fromZonedTime(endString, timezone)

        windows.push({ start: startZoned, end: endZoned })
    }

    // 6. Fetch Conflicts
    const searchStart = new Date(Math.min(...windows.map(w => w.start.getTime())))
    const searchEnd = new Date(Math.max(...windows.map(w => w.end.getTime())))

    const queryStart = addMinutes(searchStart, -bufferBefore)
    const queryEnd = addMinutes(searchEnd, bufferAfter)

    // Fetch bookings and busy blocks in parallel
    const [bookingsResult, busyResult] = await Promise.all([
        supabase
            .from('bookings')
            .select('start_at, end_at')
            .eq('provider_id', profile.id)
            .neq('status', 'cancelled')
            .lt('start_at', queryEnd.toISOString())
            .gt('end_at', queryStart.toISOString()),
        supabase
            .from('busy_blocks')
            .select('start_at, end_at')
            .eq('provider_id', profile.id)
            .lt('start_at', queryEnd.toISOString())
            .gt('end_at', queryStart.toISOString())
    ])

    const allConflicts = [
        ...(bookingsResult.data || []).map(b => ({ start: new Date(b.start_at), end: new Date(b.end_at) })),
        ...(busyResult.data || []).map(b => ({ start: new Date(b.start_at), end: new Date(b.end_at) }))
    ]

    // 7. Generate Slots
    const slots: Slot[] = []
    const now = new Date()
    const minNoticeDate = addMinutes(now, minNotice)

    for (const window of windows) {
        let cursor = window.start
        const step = 15 // minutes

        while (addMinutes(cursor, duration) <= window.end) {
            const slotStart = cursor
            const slotEnd = addMinutes(cursor, duration)

            const busyStart = addMinutes(slotStart, -bufferBefore)
            const busyEnd = addMinutes(slotEnd, bufferAfter)

            // Min Notice Check
            if (isBefore(slotStart, minNoticeDate)) {
                cursor = addMinutes(cursor, step)
                continue
            }

            // Conflict Check
            let isBlocked = false
            for (const conflict of allConflicts) {
                if (conflict.start < busyEnd && conflict.end > busyStart) {
                    isBlocked = true
                    break
                }
            }

            if (!isBlocked) {
                slots.push({
                    start: slotStart.toISOString(),
                    end: slotEnd.toISOString()
                })
            }

            cursor = addMinutes(cursor, step)
        }
    }

    return slots
}
