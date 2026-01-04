import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        const body = await request.json()
        const {
            provider_id,
            service_id,
            client_name,
            client_email,
            client_phone,
            start_at,
            end_at,
            notes
        } = body

        // Validate required fields
        if (!provider_id || !service_id || !client_name || !client_email || !start_at || !end_at) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Check for overlapping bookings
        const { data: existingBookings } = await supabase
            .from('bookings')
            .select('id')
            .eq('provider_id', provider_id)
            .eq('status', 'confirmed')
            .or(`and(start_at.lte.${start_at},end_at.gt.${start_at}),and(start_at.lt.${end_at},end_at.gte.${end_at})`)

        if (existingBookings && existingBookings.length > 0) {
            return NextResponse.json(
                { error: 'This time slot is no longer available' },
                { status: 409 }
            )
        }

        // Create booking
        const { data: booking, error } = await supabase
            .from('bookings')
            .insert({
                provider_id,
                service_id,
                client_name,
                client_email,
                client_phone,
                start_at,
                end_at,
                notes,
                status: 'confirmed'
            })
            .select()
            .single()

        if (error) {
            console.error('Booking error:', error)
            return NextResponse.json(
                { error: 'Failed to create booking' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true, booking })
    } catch (error) {
        console.error('API error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
