import { z } from 'zod'

/**
 * Validation schemas for forms throughout the application
 * Using Zod for type-safe runtime validation
 */

// Booking validation
export const bookingSchema = z.object({
    client_name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be less than 100 characters')
        .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),

    client_email: z.string()
        .email('Please enter a valid email address')
        .max(255, 'Email must be less than 255 characters')
        .optional()
        .or(z.literal('')),

    client_phone: z.string()
        .min(10, 'Phone number must be at least 10 digits')
        .max(20, 'Phone number must be less than 20 digits')
        .regex(/^[\d\s\-\+\(\)]+$/, 'Phone number can only contain digits, spaces, and +()-'),

    notes: z.string()
        .max(500, 'Notes must be less than 500 characters')
        .optional()
})

export type BookingFormData = z.infer<typeof bookingSchema>

// Service creation/edit validation
export const serviceSchema = z.object({
    name: z.string()
        .min(3, 'Service name must be at least 3 characters')
        .max(100, 'Service name must be less than 100 characters'),

    description: z.string()
        .max(1000, 'Description must be less than 1000 characters')
        .optional(),

    duration_minutes: z.number()
        .int('Duration must be a whole number')
        .min(5, 'Duration must be at least 5 minutes')
        .max(480, 'Duration must be less than 8 hours'),

    price_cents: z.number()
        .int('Price must be a whole number')
        .min(0, 'Price cannot be negative')
        .max(1000000, 'Price must be less than $10,000')
        .optional(),

    buffer_before_minutes: z.number()
        .int('Buffer must be a whole number')
        .min(0, 'Buffer cannot be negative')
        .max(120, 'Buffer must be less than 2 hours')
        .optional(),

    buffer_after_minutes: z.number()
        .int('Buffer must be a whole number')
        .min(0, 'Buffer cannot be negative')
        .max(120, 'Buffer must be less than 2 hours')
        .optional(),

    location_type: z.enum(['physical', 'virtual'], {
        errorMap: () => ({ message: 'Please select a valid location type' })
    }),

    default_location: z.string()
        .max(500, 'Location must be less than 500 characters')
        .optional()
})

export type ServiceFormData = z.infer<typeof serviceSchema>

// Profile settings validation
export const profileSchema = z.object({
    full_name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be less than 100 characters')
        .optional(),

    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be less than 30 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores')
        .optional(),

    bio: z.string()
        .max(500, 'Bio must be less than 500 characters')
        .optional(),

    phone: z.string()
        .regex(/^[\d\s\-\+\(\)]+$/, 'Phone number can only contain digits, spaces, and +()-')
        .optional()
        .or(z.literal('')),

    location: z.string()
        .max(200, 'Location must be less than 200 characters')
        .optional(),

    timezone: z.string()
        .optional()
})

export type ProfileFormData = z.infer<typeof profileSchema>

// Availability rule validation
export const availabilityRuleSchema = z.object({
    day_of_week: z.number()
        .int()
        .min(0, 'Day must be between 0-6')
        .max(6, 'Day must be between 0-6'),

    start_time_local: z.string()
        .regex(/^\d{2}:\d{2}:\d{2}$/, 'Start time must be in HH:mm:ss format'),

    end_time_local: z.string()
        .regex(/^\d{2}:\d{2}:\d{2}$/, 'End time must be in HH:mm:ss format')
}).refine(data => {
    // Ensure end time is after start time
    const start = data.start_time_local.split(':').map(Number)
    const end = data.end_time_local.split(':').map(Number)
    const startMinutes = start[0] * 60 + start[1]
    const endMinutes = end[0] * 60 + end[1]
    return endMinutes > startMinutes
}, {
    message: 'End time must be after start time',
    path: ['end_time_local']
})

export type AvailabilityRuleData = z.infer<typeof availabilityRuleSchema>

// Sign up validation
export const signupSchema = z.object({
    email: z.string()
        .email('Please enter a valid email address')
        .max(255, 'Email must be less than 255 characters'),

    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password must be less than 128 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),

    full_name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be less than 100 characters'),

    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be less than 30 characters')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, hyphens, and underscores')
})

export type SignupFormData = z.infer<typeof signupSchema>

// Login validation
export const loginSchema = z.object({
    email: z.string()
        .email('Please enter a valid email address'),

    password: z.string()
        .min(1, 'Password is required')
})

export type LoginFormData = z.infer<typeof loginSchema>

/**
 * Helper function to format Zod validation errors for display
 */
export function formatZodErrors(errors: z.ZodError): Record<string, string> {
    const formatted: Record<string, string> = {}
    errors.errors.forEach(error => {
        const path = error.path.join('.')
        formatted[path] = error.message
    })
    return formatted
}
