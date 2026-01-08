'use server'

import { createAdminClient } from '@/utils/supabase/admin'

interface CreateBookingParams {
    provider_id: string
    service_id: string
    start_at: string // ISO string
    client_name: string
    client_email: string | null
    client_phone: string
    notes?: string | null
}

function generateCancelToken() {
    // Use crypto.randomUUID() for cryptographically secure tokens
    // Remove hyphens to make it URL-friendly and compact
    return crypto.randomUUID().replace(/-/g, '')
}

export async function createBookingAction(params: CreateBookingParams) {
    const supabase = createAdminClient() as any
    const { provider_id, service_id, start_at, client_name, client_email, client_phone, notes } = params

    try {
        // Use atomic RPC to prevent race conditions
        const { data, error } = await supabase.rpc('create_booking', {
            p_provider_id: provider_id,
            p_service_id: service_id,
            p_start_at: start_at,
            p_client_name: client_name,
            p_client_email: client_email,
            p_client_phone: client_phone,
            p_notes: notes
        })

        if (error) {
            console.error('create_booking RPC error:', error)
            // Return user-friendly error messages
            return { error: error.message || 'Failed to create booking' }
        }

        // Generate cancel token (expires in 24 hours before the appointment)
        const cancelToken = generateCancelToken()
        const expiresAt = new Date(new Date(start_at).getTime() - 24 * 60 * 60 * 1000).toISOString()

        const { error: tokenError } = await supabase
            .from('action_tokens')
            .insert({
                token: cancelToken,
                type: 'cancel',
                booking_id: data.id,
                expires_at: expiresAt
            })

        if (tokenError) {
            console.error('Failed to create cancel token:', tokenError)
            // Don't fail the booking if token creation fails
        }

        // Fetch the full booking record for return
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('*')
            .eq('id', data.id)
            .single()

        if (fetchError) {
            console.error('Fetch booking error:', fetchError)
            return { error: 'Booking created but failed to retrieve details' }
        }

        return { success: true, data: booking, cancelToken }
    } catch (err) {
        console.error('Unexpected error in createBookingAction:', err)
        return { error: 'An unexpected error occurred' }
    }
}
