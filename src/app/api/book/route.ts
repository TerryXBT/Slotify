import { createAdminClient } from '@/utils/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = createAdminClient()

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

        // Validate Service & Provider
        const { data: service } = await supabase
            .from('services')
            .select('id, provider_id, is_active')
            .eq('id', service_id)
            .single()

        if (!service) {
            return NextResponse.json(
                { error: 'Service not found' },
                { status: 404 }
            )
        }

        if (service.provider_id !== provider_id) {
            return NextResponse.json(
                { error: 'Service does not belong to this provider' },
                { status: 400 }
            )
        }

        if (!service.is_active) {
            console.log('Service is not active:', service_id)
            return NextResponse.json(
                { error: 'This service is currently not available for booking' },
                { status: 400 }
            )
        }

        // Check for overlapping bookings (Robust Logic)
        // start_at < existing_end AND end_at > existing_start
        const { data: conflict } = await supabase
            .from('bookings')
            .select('id')
            .eq('provider_id', provider_id)
            .neq('status', 'cancelled') // Ignore cancelled bookings
            .lt('start_at', end_at)
            .gt('end_at', start_at)
            .limit(1)

        if (conflict && conflict.length > 0) {
            return NextResponse.json(
                { error: 'This time slot is no longer available' },
                { status: 409 }
            )
        }

        // Create booking
        const { data: booking, error } = await supabase
            // @ts-ignore
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
