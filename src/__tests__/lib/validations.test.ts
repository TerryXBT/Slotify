import { describe, it, expect } from 'vitest'
import {
    bookingSchema,
    serviceSchema,
    profileSchema,
    signupSchema,
    loginSchema,
    availabilityRuleSchema,
    formatZodErrors
} from '@/lib/validations'

describe('bookingSchema', () => {
    it('should validate a valid booking', () => {
        const validBooking = {
            client_name: 'John Doe',
            client_email: 'john@example.com',
            client_phone: '0412345678',
            notes: 'Some notes'
        }

        const result = bookingSchema.safeParse(validBooking)
        expect(result.success).toBe(true)
    })

    it('should allow empty email', () => {
        const bookingWithoutEmail = {
            client_name: 'John Doe',
            client_email: '',
            client_phone: '0412345678'
        }

        const result = bookingSchema.safeParse(bookingWithoutEmail)
        expect(result.success).toBe(true)
    })

    it('should reject name with invalid characters', () => {
        const invalidBooking = {
            client_name: 'John123',
            client_phone: '0412345678'
        }

        const result = bookingSchema.safeParse(invalidBooking)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].path).toContain('client_name')
        }
    })

    it('should reject short phone numbers', () => {
        const invalidBooking = {
            client_name: 'John Doe',
            client_phone: '12345'
        }

        const result = bookingSchema.safeParse(invalidBooking)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].path).toContain('client_phone')
        }
    })

    it('should reject invalid email format', () => {
        const invalidBooking = {
            client_name: 'John Doe',
            client_email: 'not-an-email',
            client_phone: '0412345678'
        }

        const result = bookingSchema.safeParse(invalidBooking)
        expect(result.success).toBe(false)
    })
})

describe('serviceSchema', () => {
    it('should validate a valid service', () => {
        const validService = {
            name: 'Tennis Lesson',
            description: 'A 1-hour tennis lesson',
            duration_minutes: 60,
            price_cents: 5000,
            location_type: 'physical' as const,
            default_location: 'Tennis Court 1'
        }

        const result = serviceSchema.safeParse(validService)
        expect(result.success).toBe(true)
    })

    it('should reject duration less than 5 minutes', () => {
        const invalidService = {
            name: 'Quick Service',
            duration_minutes: 3,
            location_type: 'virtual' as const
        }

        const result = serviceSchema.safeParse(invalidService)
        expect(result.success).toBe(false)
    })

    it('should reject duration over 8 hours', () => {
        const invalidService = {
            name: 'Long Service',
            duration_minutes: 500,
            location_type: 'physical' as const
        }

        const result = serviceSchema.safeParse(invalidService)
        expect(result.success).toBe(false)
    })
})

describe('signupSchema', () => {
    it('should validate a valid signup', () => {
        const validSignup = {
            email: 'user@example.com',
            password: 'Password1',
            full_name: 'John Doe',
            username: 'johndoe'
        }

        const result = signupSchema.safeParse(validSignup)
        expect(result.success).toBe(true)
    })

    it('should require uppercase letter in password', () => {
        const invalidSignup = {
            email: 'user@example.com',
            password: 'password1',
            full_name: 'John Doe',
            username: 'johndoe'
        }

        const result = signupSchema.safeParse(invalidSignup)
        expect(result.success).toBe(false)
    })

    it('should require number in password', () => {
        const invalidSignup = {
            email: 'user@example.com',
            password: 'Password',
            full_name: 'John Doe',
            username: 'johndoe'
        }

        const result = signupSchema.safeParse(invalidSignup)
        expect(result.success).toBe(false)
    })

    it('should reject username with special characters', () => {
        const invalidSignup = {
            email: 'user@example.com',
            password: 'Password1',
            full_name: 'John Doe',
            username: 'john@doe'
        }

        const result = signupSchema.safeParse(invalidSignup)
        expect(result.success).toBe(false)
    })
})

describe('availabilityRuleSchema', () => {
    it('should validate a valid rule', () => {
        const validRule = {
            day_of_week: 1,
            start_time_local: '09:00:00',
            end_time_local: '17:00:00'
        }

        const result = availabilityRuleSchema.safeParse(validRule)
        expect(result.success).toBe(true)
    })

    it('should reject end time before start time', () => {
        const invalidRule = {
            day_of_week: 1,
            start_time_local: '17:00:00',
            end_time_local: '09:00:00'
        }

        const result = availabilityRuleSchema.safeParse(invalidRule)
        expect(result.success).toBe(false)
    })
})

describe('formatZodErrors', () => {
    it('should format errors correctly', () => {
        const result = bookingSchema.safeParse({
            client_name: 'A',
            client_phone: '123'
        })

        if (!result.success) {
            // Zod v4 uses 'issues' not 'errors' on the result object
            const formatted = formatZodErrors(result.error)
            expect(typeof formatted).toBe('object')
            // Should have error messages for invalid fields
            expect(Object.keys(formatted).length).toBeGreaterThan(0)
        }
    })
})
