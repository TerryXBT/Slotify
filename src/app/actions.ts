'use server'

import { getAvailableSlots } from '@/lib/availability'

export async function fetchSlots(username: string, serviceId: string, date: string) {
    try {
        const slots = await getAvailableSlots(username, serviceId, date)
        return { success: true, slots }
    } catch (error: unknown) {
        console.error('Error fetching slots:', error)
        const message = error instanceof Error ? error.message : 'Failed to fetch slots'
        return { success: false, error: message }
    }
}
