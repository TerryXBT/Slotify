import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createClient as createAdminClientRaw } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Create admin client with direct postgres connection
function createDirectClient() {
    return createAdminClientRaw(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            db: {
                schema: 'public'
            },
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const body = await request.json()
        const {
            name,
            description,
            duration_minutes,
            price_cents,
            price_negotiable,
            location_type,
            default_location,
            buffer_minutes,
            cancellation_policy
        } = body

        // Validate required fields
        if (!name?.trim()) {
            return NextResponse.json({ error: 'Service name is required' }, { status: 400 })
        }

        if (!duration_minutes || duration_minutes < 5 || duration_minutes > 480) {
            return NextResponse.json({ error: 'Duration must be between 5 and 480 minutes' }, { status: 400 })
        }

        const adminClient = createDirectClient()

        // Insert using direct SQL via Supabase's postgres connection
        const { data, error } = await adminClient
            .from('services')
            .insert({
                provider_id: user.id,
                name: name.trim(),
                description: description || null,
                duration_minutes,
                price_cents: price_cents || null,
                price_negotiable: price_negotiable || false,
                location_type: location_type || 'physical',
                default_location: default_location || '',
                buffer_minutes: buffer_minutes || null,
                cancellation_policy: cancellation_policy || null
            })
            .select('id')
            .single()

        if (error) {
            console.error('Create Service API Error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        revalidatePath('/app/settings')
        revalidatePath('/app/services')

        return NextResponse.json({ success: true, id: data?.id })
    } catch (err) {
        console.error('Create Service API Exception:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const body = await request.json()
        const {
            id,
            name,
            description,
            duration_minutes,
            price_cents,
            price_negotiable,
            location_type,
            default_location,
            is_active,
            buffer_minutes,
            cancellation_policy
        } = body

        if (!id) {
            return NextResponse.json({ error: 'Service ID is required' }, { status: 400 })
        }

        if (!name?.trim()) {
            return NextResponse.json({ error: 'Service name is required' }, { status: 400 })
        }

        const adminClient = createDirectClient()

        const { error } = await adminClient
            .from('services')
            .update({
                name: name.trim(),
                description: description || null,
                duration_minutes,
                price_cents: price_cents || null,
                price_negotiable: price_negotiable || false,
                location_type: location_type || 'physical',
                default_location: default_location || '',
                is_active: is_active ?? true,
                buffer_minutes: buffer_minutes || null,
                cancellation_policy: cancellation_policy || null
            })
            .eq('id', id)
            .eq('provider_id', user.id)

        if (error) {
            console.error('Update Service API Error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        revalidatePath('/app/settings')
        revalidatePath('/app/services')

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error('Update Service API Exception:', err)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
