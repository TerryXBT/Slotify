'use server'

import { emailService } from '@/lib/email/service'
import { createClient } from '@/utils/supabase/server'

export async function sendConfirmationEmail(bookingId: string) {
    const supabase = await createClient() // Access as anon is restricted for reading Booking?
    // Actually, RLS prevents anon from reading booking details unless we use Admin.
    // However, this action runs on server. We can use Service Role or just pass the details in payload?
    // Passing details is insecure (user can spoof emails).
    // Best practice: Use Service Role to fetch booking details by ID and verified it exists, then send.

    const adminClient = await createClient()
    // Wait, createClient uses cookies. We need admin client for server-side trusted read if RLS blocks us.
    // But wait, the standard createClient here is scoped to the user (who is Anon for public booking).
    // Anon CANNOT read the booking they just created if strict RLS (insert allowed, select not).

    // We should use the SUPABASE_SERVICE_ROLE_KEY to create a trusted client.
    const { createClient: createSupabaseClient } = require('@supabase/supabase-js')
    const admin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: booking } = await admin
        .from('bookings')
        .select('*, services(name), profiles(full_name)')
        .eq('id', bookingId)
        .single()

    if (!booking) {
        console.error('Booking not found for email')
        return
    }

    await emailService.sendBookingConfirmation(
        booking.client_email,
        booking.client_name,
        booking.services.name,
        new Date(booking.start_at).toLocaleString(),
        booking.profiles.full_name
    )
}
