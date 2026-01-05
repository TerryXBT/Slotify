'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { startOfDay, endOfDay, addDays, startOfWeek } from 'date-fns'

export async function getCalendarEvents(dateStr: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const adminClient = createAdminClient()

    const targetDate = new Date(dateStr)
    // Fetch full week + buffer
    // targetDate usually comes in as start of week from frontend, but let's be safe
    const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 })
    const weekEnd = addDays(weekStart, 6)

    // Buffer: -2 days before week start, +2 days after week end
    const start = addDays(startOfDay(weekStart), -2).toISOString()
    const end = addDays(endOfDay(weekEnd), 2).toISOString()

    // Fetch Bookings (Using Admin Client + Left Join to ensure data availability)
    const { data: bookings } = await adminClient
        .from('bookings')
        .select(`
            id, 
            status, 
            start_at, 
            end_at, 
            client_name, 
            services!left(name)
        `)
        .eq('provider_id', user.id)
        .gte('start_at', start)
        .lte('start_at', end)
        .neq('status', 'cancelled')

    // Fetch Busy Blocks
    const { data: busyBlocks } = await adminClient
        .from('busy_blocks')
        .select('*')
        .eq('provider_id', user.id)
        .gte('start_at', start)
        .lte('start_at', end)

    // Debug: Check total count without filters
    const { count } = await adminClient
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('provider_id', user.id)

    return {
        bookings: bookings || [],
        busyBlocks: busyBlocks || []
    }
}

export async function createManualBooking(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const clientName = formData.get('clientName') as string
    const clientEmail = formData.get('clientEmail') as string
    const clientPhone = formData.get('clientPhone') as string
    const serviceId = formData.get('serviceId') as string
    const date = formData.get('date') as string
    const time = formData.get('time') as string

    console.log('🔵 createManualBooking called with:', { clientName, clientEmail, clientPhone, serviceId, date, time })

    if (!clientName || !clientPhone || !serviceId || !date || !time) {
        console.log('🔴 Missing fields:', { clientName: !!clientName, clientPhone: !!clientPhone, serviceId: !!serviceId, date: !!date, time: !!time })
        return { error: 'Missing required fields' }
    }

    // Get service duration (use admin client to bypass RLS)
    const adminClient = createAdminClient()
    const { data: service } = await adminClient
        .from('services')
        .select('duration_minutes, price_cents')
        .eq('id', serviceId)
        .eq('provider_id', user.id)
        .single() as { data: { duration_minutes: number; price_cents: number } | null }

    if (!service) return { error: 'Service not found' }

    const startAt = new Date(`${date}T${time}`)
    const endAt = new Date(startAt.getTime() + service.duration_minutes * 60000)

    // Check availability? For manual override, maybe we skip check or warn?
    // Requirement says "Manual entry", usually implies override. Let's just insert.
    // But we should probably check for conflicts generally, but "Manual" often permits double booking in real world ops.
    // Let's stick to standard insert for now.

    const { error } = await adminClient
        .from('bookings')
        .insert({
            provider_id: user.id,
            service_id: serviceId,
            client_name: clientName,
            client_email: clientEmail || null,
            client_phone: clientPhone,
            start_at: startAt.toISOString(),
            end_at: endAt.toISOString(),
            status: 'confirmed'
        } as any)

    if (error) {
        console.error('Create manual booking error:', error)
        return { error: 'Failed to create booking' }
    }

    return { success: true }
}
