'use server'

import { getAvailableSlots } from '@/lib/availability'

export async function fetchSlots(username: string, serviceId: string, date: string) {
    try {
        const slots = await getAvailableSlots(username, serviceId, date)
        return { success: true, slots }
    } catch (error: any) {
        console.error('Error fetching slots:', error)
        return { success: false, error: error.message || 'Failed to fetch slots' }
    }
}
