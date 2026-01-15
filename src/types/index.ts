/**
 * Shared application types derived from Supabase schema
 * Use these types instead of `any` throughout the application
 */

import { Database } from './supabase'

// Base table types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Service = Database['public']['Tables']['services']['Row']
export type Booking = Database['public']['Tables']['bookings']['Row']
export type AvailabilityRule = Database['public']['Tables']['availability_rules']['Row']
export type AvailabilitySettings = Database['public']['Tables']['availability_settings']['Row']
export type BusyBlock = Database['public']['Tables']['busy_blocks']['Row']
export type ActionToken = Database['public']['Tables']['action_tokens']['Row']
export type RescheduleProposal = Database['public']['Tables']['reschedule_proposals']['Row']
export type RescheduleOption = Database['public']['Tables']['reschedule_options']['Row']

// Insert types
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ServiceInsert = Database['public']['Tables']['services']['Insert']
export type BookingInsert = Database['public']['Tables']['bookings']['Insert']

// Update types
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']
export type ServiceUpdate = Database['public']['Tables']['services']['Update']
export type BookingUpdate = Database['public']['Tables']['bookings']['Update']

// Booking with relations (from join queries)
export type BookingWithService = Booking & {
    services: Pick<Service, 'name' | 'duration_minutes' | 'location_type' | 'default_location'> | null
}

export type BookingWithFullService = Booking & {
    services: Service | null
}

export type BookingWithProfile = Booking & {
    profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url' | 'username'> | null
}

// Booking status type
export type BookingStatus =
    | 'pending'
    | 'confirmed'
    | 'completed'
    | 'cancelled'
    | 'no_show'
    | 'pending_reschedule'

// Location type
export type LocationType = 'in_person' | 'video' | 'phone' | null

// Form state types for server actions
export type ActionState = {
    success?: boolean
    error?: string
    message?: string
}

export type FormActionState = ActionState | null

// Service form data
export interface ServiceFormData {
    name: string
    duration_minutes: number
    price_cents?: number | null
    description?: string | null
    location_type?: LocationType
    default_location?: string | null
    is_active?: boolean
}

// Profile form data
export interface ProfileFormData {
    full_name?: string | null
    username: string
    bio?: string | null
    phone?: string | null
    timezone?: string | null
    avatar_url?: string | null
    cancellation_policy_text?: string | null
}

// Availability rule form data
export interface AvailabilityRuleFormData {
    day_of_week: number
    start_time_local: string
    end_time_local: string
}

// Error types for better error handling
export interface SupabaseError {
    message: string
    code?: string
    details?: string
    hint?: string
}

// Audit log types
export type AuditAction =
    | 'booking.create'
    | 'booking.update'
    | 'booking.cancel'
    | 'booking.reschedule'
    | 'service.create'
    | 'service.update'
    | 'service.delete'
    | 'profile.update'

export interface AuditLogData {
    userId: string
    action: AuditAction
    entityType: string
    entityId: string
    oldData?: Record<string, unknown>
    newData?: Record<string, unknown>
    metadata?: Record<string, unknown>
}
