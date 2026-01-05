'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { startOfDay, endOfDay, addMinutes } from 'date-fns'

interface CreateBookingParams {
    provider_id: string
    service_id: string
    start_at: string // ISO string
    client_name: string
    client_email: string
    client_phone?: string | null
    notes?: string | null
}

export async function createBookingAction(params: CreateBookingParams) {
    const supabase = createAdminClient() as any
    const { provider_id, service_id, start_at, client_name, client_email, client_phone, notes } = params

    const startTime = new Date(start_at)

    // 1. Get Service Details
    const { data: service, error: serviceError } = await supabase
        .from('services')
        .select('duration_minutes')
        .eq('id', service_id)
        .single()

    if (serviceError || !service) {
        return { error: 'Service not found' }
    }

    const duration = service.duration_minutes

    // 2. Get Availability Settings (Buffers)
    const { data: settings } = await supabase
        .from('availability_settings')
        .select('buffer_before_minutes, buffer_after_minutes')
        .eq('provider_id', provider_id)
        .single()

    const bufferBefore = settings?.buffer_before_minutes || 0
    const bufferAfter = settings?.buffer_after_minutes || 0

    // 3. Calculate Times
    const endTime = addMinutes(startTime, duration)
    const totalStart = addMinutes(startTime, -bufferBefore)
    const totalEnd = addMinutes(endTime, bufferAfter)

    const totalStartStr = totalStart.toISOString()
    const totalEndStr = totalEnd.toISOString()

    // 4. Check Busy Blocks Conflicts
    const { data: busyConflicts, error: busyError } = await supabase
        .from('busy_blocks')
        .select('id')
        .eq('provider_id', provider_id)
        .lt('start_at', totalEndStr)
        .gt('end_at', totalStartStr)

    if (busyError) console.error('Busy check error', busyError)
    if (busyConflicts && busyConflicts.length > 0) {
        return { error: 'Slot blocked by busy time' }
    }

    // 5. Check Existing Bookings Conflicts
    // Overlap: (StartA < EndB) and (EndA > StartB)
    // We need to account for buffers of existing bookings too, but as per SQL logic we use current settings.
    // Existing effective range: [b.start - buf, b.end + buf]
    // New effective range: [totalStart, totalEnd]

    // We can't easily dynamic calc buffer in query builder.
    // So we fetch potential overlapping bookings and check in JS, or assume standard overlap.
    // Let's simplified check: check if any booking overlaps our Total Range with IT'S raw range expanded by buffers.
    // Actually, SQL logic was:
    // existing.start - buffer < new.totalEnd AND existing.end + buffer > new.totalStart

    // Limits of Supabase Query Builder: can't do complex arithmetic on columns easily without RPC.
    // Workaround: Fetch bookings in a wider range and filter in JS.
    // Range: totalStart - max_buffer to totalEnd + max_buffer. Max buffer safe guess 60min?
    // Let's just fetch bookings that overlap the raw time window and check.

    // Safer approach: Fetch all bookings for the day (and adjacent days if spans midnight).
    const searchStart = addMinutes(totalStart, -180).toISOString() // 3 hours padding
    const searchEnd = addMinutes(totalEnd, 180).toISOString()

    const { data: existingBookings, error: bookingCheckError } = await supabase
        .from('bookings')
        .select('start_at, end_at')
        .eq('provider_id', provider_id)
        .neq('status', 'cancelled')
        .lt('start_at', searchEnd)
        .gt('end_at', searchStart)

    if (bookingCheckError) console.error(bookingCheckError)

    if (existingBookings) {
        for (const b of existingBookings) {
            const bStart = new Date(b.start_at)
            const bEnd = new Date(b.end_at)

            // Expand existing booking by CURRENT buffers (Approximation)
            const bEffStart = addMinutes(bStart, -bufferBefore)
            const bEffEnd = addMinutes(bEnd, bufferAfter)

            // Check overlap with New Effective Range
            if (bEffStart < totalEnd && bEffEnd > totalStart) {
                return { error: 'Slot blocked by existing booking' }
            }
        }
    }

    // 6. Insert Booking
    const { data: newBooking, error: insertError } = await supabase
        .from('bookings')
        .insert({
            provider_id,
            service_id,
            client_name,
            client_email,
            client_phone,
            notes,
            start_at: startTime.toISOString(),
            end_at: endTime.toISOString(),
            status: 'confirmed'
        })
        .select()
        .single()

    if (insertError) {
        console.error('Insert error', insertError)
        return { error: 'Failed to create booking' }
    }

    return { success: true, data: newBooking }
}
