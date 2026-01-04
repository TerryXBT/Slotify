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

    const { error } = await adminClient
        .from('profiles')
        .update(updateData)
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

    const adminClient = createAdminClient()

    const name = formData.get('name') as string
    const duration_minutes = parseInt(formData.get('duration') as string)
    const price_cents = parseInt(formData.get('price') as string) * 100
    const location_type = formData.get('location_type') as string || 'physical'
    const default_location = formData.get('default_location') as string || ''

    const { error } = await adminClient
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
        return { error: 'Failed to create service: ' + error.message }
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

    const adminClient = createAdminClient()

    const name = formData.get('name') as string
    const duration_minutes = parseInt(formData.get('duration') as string)
    const price_cents = parseInt(formData.get('price') as string) * 100
    const location_type = formData.get('location_type') as string || 'physical'
    const default_location = formData.get('default_location') as string || ''

    const { error } = await adminClient
        .from('services')
        .update({
            name,
            duration_minutes,
            price_cents,
            location_type,
            default_location
        })
        .eq('id', id)
        .eq('provider_id', user.id)

    if (error) {
        console.error('Update Service Error:', error)
        return { error: 'Failed to update service' }
    }

    revalidatePath('/app/settings')
    return { success: true }
}

/**
 * Delete Service
 */
export async function deleteService(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const adminClient = createAdminClient()

    const { error } = await adminClient
        .from('services')
        .delete()
        .eq('id', id)
        .eq('provider_id', user.id)

    if (error) {
        console.error('Delete Service Error:', error)
        return { error: 'Failed to delete service' }
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

        const { error } = await adminClient
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

        const { error } = await adminClient
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

        const { error } = await adminClient
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
