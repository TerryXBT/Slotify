export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    username: string
                    full_name: string | null
                    timezone: string
                    cancellation_policy_text: string | null
                    created_at: string
                }
                Insert: {
                    id: string
                    username: string
                    full_name?: string | null
                    timezone?: string
                    cancellation_policy_text?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    username?: string
                    full_name?: string | null
                    timezone?: string
                    cancellation_policy_text?: string | null
                    created_at?: string
                }
            }
            services: {
                Row: {
                    id: string
                    provider_id: string
                    name: string
                    duration_minutes: number
                    price_cents: number | null
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    provider_id: string
                    name: string
                    duration_minutes: number
                    price_cents?: number | null
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    provider_id?: string
                    name?: string
                    duration_minutes?: number
                    price_cents?: number | null
                    is_active?: boolean
                    created_at?: string
                }
            }
            availability_settings: {
                Row: {
                    provider_id: string
                    min_notice_minutes: number
                    horizon_days: number
                    buffer_before_minutes: number
                    buffer_after_minutes: number
                }
                Insert: {
                    provider_id: string
                    min_notice_minutes?: number
                    horizon_days?: number
                    buffer_before_minutes?: number
                    buffer_after_minutes?: number
                }
                Update: {
                    provider_id?: string
                    min_notice_minutes?: number
                    horizon_days?: number
                    buffer_before_minutes?: number
                    buffer_after_minutes?: number
                }
            }
            availability_rules: {
                Row: {
                    id: string
                    provider_id: string
                    day_of_week: number
                    start_time_local: string
                    end_time_local: string
                }
                Insert: {
                    id?: string
                    provider_id: string
                    day_of_week: number
                    start_time_local: string
                    end_time_local: string
                }
                Update: {
                    id?: string
                    provider_id?: string
                    day_of_week?: number
                    start_time_local?: string
                    end_time_local?: string
                }
            }
            busy_blocks: {
                Row: {
                    id: string
                    provider_id: string
                    start_at: string
                    end_at: string
                    title: string | null
                    repeat_type: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    provider_id: string
                    start_at: string
                    end_at: string
                    title?: string | null
                    repeat_type?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    provider_id?: string
                    start_at?: string
                    end_at?: string
                    title?: string | null
                    repeat_type?: string | null
                    created_at?: string
                }
            }
            bookings: {
                Row: {
                    id: string
                    provider_id: string
                    service_id: string
                    client_name: string
                    client_email: string
                    client_phone: string | null
                    notes: string | null
                    start_at: string
                    end_at: string
                    status: 'confirmed' | 'pending_reschedule' | 'cancelled'
                    created_at: string
                }
                Insert: {
                    id?: string
                    provider_id: string
                    service_id: string
                    client_name: string
                    client_email: string
                    client_phone?: string | null
                    notes?: string | null
                    start_at: string
                    end_at: string
                    status: 'confirmed' | 'pending_reschedule' | 'cancelled'
                    created_at?: string
                }
                Update: {
                    id?: string
                    provider_id?: string
                    service_id?: string
                    client_name?: string
                    client_email?: string
                    client_phone?: string | null
                    notes?: string | null
                    start_at?: string
                    end_at?: string
                    status?: 'confirmed' | 'pending_reschedule' | 'cancelled'
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
