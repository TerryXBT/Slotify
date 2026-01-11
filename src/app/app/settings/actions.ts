'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

/**
 * Update User Profile
 */
export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const adminClient = createAdminClient()

    const fullName = formData.get('full_name') as string
    const avatarUrl = formData.get('avatar_url') as string | null
    const bio = formData.get('bio') as string | null
    const location = formData.get('location') as string | null
    const phone = formData.get('phone') as string | null
    const email = formData.get('email') as string | null
    const cancellationPolicy = formData.get('cancellation_policy') as string | null

    const updateData: any = {
        full_name: fullName
    }

    if (avatarUrl) updateData.avatar_url = avatarUrl
    if (bio) updateData.bio = bio
    if (location) updateData.location = location
    if (phone) updateData.phone = phone
    if (email) updateData.email = email
    if (cancellationPolicy) updateData.cancellation_policy = cancellationPolicy

    const { error } = await (adminClient as any)
        .from('profiles')
        .update(updateData as any)
        .eq('id', user.id)

    if (error) {
        console.error('Update Profile Error:', error)
        return { error: 'Failed to update profile' }
    }

    revalidatePath('/app/settings')
    revalidatePath(`/${user.id}`)
    return { success: true }
}

/**
 * Sign Out
 */
export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    return { success: true }
}


/**
 * Create Service
 */
export async function createService(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Extract and validate inputs
    const name = (formData.get('name') as string)?.trim()
    const durationStr = formData.get('duration') as string
    const priceStr = formData.get('price') as string
    const location_type = formData.get('location_type') as string || 'physical'
    const default_location = formData.get('default_location') as string || ''

    // Validate required fields
    if (!name) {
        return { error: 'Service name is required' }
    }

    // Validate duration
    const duration_minutes = parseInt(durationStr)
    if (isNaN(duration_minutes) || duration_minutes < 5 || duration_minutes > 480) {
        return { error: 'Duration must be between 5 and 480 minutes' }
    }

    // Validate price
    const price = parseFloat(priceStr)
    if (isNaN(price) || price < 0 || price > 10000) {
        return { error: 'Price must be between $0 and $10,000' }
    }
    const price_cents = Math.round(price * 100)

    const adminClient = createAdminClient()

    const { error } = await (adminClient as any)
        .from('services')
        .insert({
            provider_id: user.id,
            name,
            duration_minutes,
            price_cents,
            location_type,
            default_location
        })

    if (error) {
        console.error('Create Service Error:', error)
        return { error: `Failed to create service: ${error.message}`, code: error.code }
    }

    revalidatePath('/app/settings')
    return { success: true }
}

/**
 * Update Service
 */
export async function updateService(id: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Extract and validate inputs
    const name = (formData.get('name') as string)?.trim()
    const durationStr = formData.get('duration') as string
    const priceStr = formData.get('price') as string
    const location_type = formData.get('location_type') as string || 'physical'
    const default_location = formData.get('default_location') as string || ''
    const is_active = formData.get('is_active') === 'on'

    // Validate required fields
    if (!name) {
        return { error: 'Service name is required' }
    }

    // Validate duration
    const duration_minutes = parseInt(durationStr)
    if (isNaN(duration_minutes) || duration_minutes < 5 || duration_minutes > 480) {
        return { error: 'Duration must be between 5 and 480 minutes' }
    }

    // Validate price
    const price = parseFloat(priceStr)
    if (isNaN(price) || price < 0 || price > 10000) {
        return { error: 'Price must be between $0 and $10,000' }
    }
    const price_cents = Math.round(price * 100)

    const adminClient = createAdminClient()

    const { error } = await (adminClient as any)
        .from('services')
        .update({
            name,
            duration_minutes,
            price_cents,
            location_type,
            default_location,
            is_active
        })
        .eq('id', id)
        .eq('provider_id', user.id)

    if (error) {
        console.error('Update Service Error:', error)
        return { error: `Failed to update service: ${error.message}`, code: error.code }
    }

    revalidatePath('/app/settings')
    return { success: true }
}

/**
 * Soft Delete Service (move to trash)
 */
export async function deleteService(id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Not authenticated' }

        const adminClient = createAdminClient()

        // Soft delete: set deleted_at timestamp
        const { error } = await (adminClient as any)
            .from('services')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id)
            .eq('provider_id', user.id)
            .is('deleted_at', null) // Only delete if not already deleted

        if (error) {
            console.error('Soft Delete Service Error:', error)
            return { error: `Failed to delete service: ${error.message}` }
        }

        revalidatePath('/app/settings')
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in deleteService:', err)
        return { error: 'An unexpected error occurred while deleting the service' }
    }
}

/**
 * Restore Service (undelete from trash)
 */
export async function restoreService(id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Not authenticated' }

        const adminClient = createAdminClient()

        // Clear deleted_at to restore
        const { error } = await (adminClient as any)
            .from('services')
            .update({ deleted_at: null })
            .eq('id', id)
            .eq('provider_id', user.id)

        if (error) {
            console.error('Restore Service Error:', error)
            return { error: `Failed to restore service: ${error.message}` }
        }

        revalidatePath('/app/settings')
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in restoreService:', err)
        return { error: 'An unexpected error occurred while restoring the service' }
    }
}

/**
 * Permanently Delete Service (including all related bookings)
 */
export async function permanentlyDeleteService(id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { error: 'Not authenticated' }

        const adminClient = createAdminClient()

        // First, delete all related bookings
        const { error: bookingsError } = await (adminClient as any)
            .from('bookings')
            .delete()
            .eq('service_id', id)

        if (bookingsError) {
            console.error('Delete Bookings Error:', bookingsError)
            return { error: `Failed to delete related bookings: ${bookingsError.message}` }
        }

        // Then, permanently delete the service
        const { error: serviceError } = await (adminClient as any)
            .from('services')
            .delete()
            .eq('id', id)
            .eq('provider_id', user.id)

        if (serviceError) {
            console.error('Permanent Delete Service Error:', serviceError)
            return { error: `Failed to permanently delete service: ${serviceError.message}` }
        }

        revalidatePath('/app/settings')
        return { success: true }
    } catch (err) {
        console.error('Unexpected error in permanentlyDeleteService:', err)
        return { error: 'An unexpected error occurred while permanently deleting the service' }
    }
}


/**
 * Toggle Service Active Status
 */
export async function toggleServiceActive(id: string, isActive: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const adminClient = createAdminClient()

    const { error } = await (adminClient as any)
        .from('services')
        .update({ is_active: isActive })
        .eq('id', id)
        .eq('provider_id', user.id)

    if (error) {
        console.error('Toggle Service Active Error:', error)
        return { error: 'Failed to update service status' }
    }

    revalidatePath('/app/settings')
    return { success: true }
}

// ============= AVAILABILITY RULES =============

export async function createAvailabilityRule(formData: FormData) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Not authenticated' }
        }

        const adminClient = createAdminClient()

        const day_of_week = parseInt(formData.get('day_of_week') as string)
        const start_time = formData.get('start_time') as string
        const end_time = formData.get('end_time') as string

        const { error} = await (adminClient as any)
            .from('availability_rules')
            .insert({
                provider_id: user.id,
                day_of_week,
                start_time_local: `${start_time}:00`,
                end_time_local: `${end_time}:00`
            })

        if (error) {
            console.error('Create availability rule error:', error)
            return { error: error.message }
        }

        revalidatePath('/app/settings')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function updateAvailabilityRule(id: string, formData: FormData) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Not authenticated' }
        }

        const adminClient = createAdminClient()

        const start_time = formData.get('start_time') as string
        const end_time = formData.get('end_time') as string

        const { error } = await (adminClient as any)
            .from('availability_rules')
            .update({
                start_time_local: `${start_time}:00`,
                end_time_local: `${end_time}:00`
            })
            .eq('id', id)
            .eq('provider_id', user.id)

        if (error) {
            console.error('Update availability rule error:', error)
            return { error: error.message }
        }

        revalidatePath('/app/settings')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}

export async function deleteAvailabilityRule(id: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return { error: 'Not authenticated' }
        }

        const adminClient = createAdminClient()

        const { error } = await (adminClient as any)
            .from('availability_rules')
            .delete()
            .eq('id', id)
            .eq('provider_id', user.id)

        if (error) {
            console.error('Delete availability rule error:', error)
            return { error: error.message }
        }

        revalidatePath('/app/settings')
        return { success: true }
    } catch (error: any) {
        return { error: error.message }
    }
}
