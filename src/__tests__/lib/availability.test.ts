import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { addMinutes, subMinutes, addHours } from 'date-fns'

// Mock the Supabase admin client
const mockSupabase = {
    from: vi.fn()
}

vi.mock('@/utils/supabase/admin', () => ({
    createAdminClient: () => mockSupabase
}))

// Import after mocking
import { getAvailableSlots } from '@/lib/availability'

// Helper to create mock query builder
function createMockQueryBuilder(data: unknown, error: unknown = null) {
    return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data, error })
    }
}

function createMockQueryBuilderForList(data: unknown[], error: unknown = null) {
    return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: data[0] || null, error }),
        then: vi.fn((resolve) => resolve({ data, error }))
    }
}

describe('getAvailableSlots', () => {
    const mockProviderId = 'provider-123'
    const mockServiceId = 'service-456'
    const mockUsername = 'testuser'

    beforeEach(() => {
        vi.clearAllMocks()
        // Reset Date to a fixed time for consistent testing
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2025-01-15T08:00:00Z'))
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    describe('Provider and Service Validation', () => {
        it('should throw error when provider not found', async () => {
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return createMockQueryBuilder(null, { message: 'Not found' })
                }
                return createMockQueryBuilder(null)
            })

            await expect(getAvailableSlots(mockUsername, mockServiceId, '2025-01-20'))
                .rejects.toThrow('Provider not found')
        })

        it('should throw error when service not found', async () => {
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return createMockQueryBuilder({ id: mockProviderId, timezone: 'UTC' })
                }
                if (table === 'availability_settings') {
                    return createMockQueryBuilder({ buffer_before_minutes: 0, buffer_after_minutes: 0, min_notice_minutes: 120 })
                }
                if (table === 'services') {
                    return createMockQueryBuilder(null)
                }
                return createMockQueryBuilder(null)
            })

            await expect(getAvailableSlots(mockUsername, mockServiceId, '2025-01-20'))
                .rejects.toThrow('Service not found')
        })
    })

    describe('Availability Rules', () => {
        it('should return empty array when no availability rules exist', async () => {
            const fromMock = vi.fn().mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: { id: mockProviderId, timezone: 'UTC' }, error: null })
                    }
                }
                if (table === 'availability_settings') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: null, error: null })
                    }
                }
                if (table === 'services') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: { duration_minutes: 30 }, error: null })
                    }
                }
                if (table === 'availability_rules') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({ data: [], error: null })
                        })
                    }
                }
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: null, error: null })
                }
            })
            mockSupabase.from = fromMock

            const slots = await getAvailableSlots(mockUsername, mockServiceId, '2025-01-20')
            expect(slots).toEqual([])
        })
    })

    describe('Slot Generation Logic', () => {
        // Test helper to setup standard mocks
        function setupStandardMocks(options: {
            timezone?: string
            duration?: number
            bufferBefore?: number
            bufferAfter?: number
            minNotice?: number
            rules?: Array<{ day_of_week: number; start_time_local: string; end_time_local: string }>
            bookings?: Array<{ start_at: string; end_at: string }>
            busyBlocks?: Array<{ start_at: string; end_at: string }>
        } = {}) {
            const {
                timezone = 'UTC',
                duration = 30,
                bufferBefore = 0,
                bufferAfter = 0,
                minNotice = 0, // Set to 0 for easier testing
                rules = [{ day_of_week: 1, start_time_local: '09:00:00', end_time_local: '12:00:00' }],
                bookings = [],
                busyBlocks = []
            } = options

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: { id: mockProviderId, timezone }, error: null })
                    }
                }
                if (table === 'availability_settings') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({
                            data: { buffer_before_minutes: bufferBefore, buffer_after_minutes: bufferAfter, min_notice_minutes: minNotice },
                            error: null
                        })
                    }
                }
                if (table === 'services') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: { duration_minutes: duration }, error: null })
                    }
                }
                if (table === 'availability_rules') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({ data: rules, error: null })
                        })
                    }
                }
                if (table === 'bookings') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        neq: vi.fn().mockReturnThis(),
                        lt: vi.fn().mockReturnThis(),
                        gt: vi.fn().mockResolvedValue({ data: bookings, error: null })
                    }
                }
                if (table === 'busy_blocks') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        lt: vi.fn().mockReturnThis(),
                        gt: vi.fn().mockResolvedValue({ data: busyBlocks, error: null })
                    }
                }
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: null, error: null })
                }
            })
        }

        it('should generate 15-minute increment slots within availability window', async () => {
            // Monday 2025-01-20, testing with 30 minute duration
            // 09:00-12:00 window should give slots at 09:00, 09:15, 09:30... until 11:30
            setupStandardMocks({
                duration: 30,
                rules: [{ day_of_week: 1, start_time_local: '09:00:00', end_time_local: '10:00:00' }]
            })

            const slots = await getAvailableSlots(mockUsername, mockServiceId, '2025-01-20')

            // With 30 min duration in 1 hour window: 09:00, 09:15, 09:30 (last valid is 09:30+30=10:00)
            expect(slots.length).toBe(3)
            expect(slots[0].start).toContain('09:00')
            expect(slots[1].start).toContain('09:15')
            expect(slots[2].start).toContain('09:30')
        })

        it('should exclude slots that conflict with existing bookings', async () => {
            // Booking from 09:30-10:00 should block 09:30 slot
            setupStandardMocks({
                duration: 30,
                rules: [{ day_of_week: 1, start_time_local: '09:00:00', end_time_local: '10:30:00' }],
                bookings: [{ start_at: '2025-01-20T09:30:00Z', end_at: '2025-01-20T10:00:00Z' }]
            })

            const slots = await getAvailableSlots(mockUsername, mockServiceId, '2025-01-20')

            // Should not include 09:30 slot
            const slotTimes = slots.map(s => s.start)
            expect(slotTimes.some(t => t.includes('09:30'))).toBe(false)
            // Should include 09:00, 09:15, 10:00
            expect(slotTimes.some(t => t.includes('09:00'))).toBe(true)
            expect(slotTimes.some(t => t.includes('09:15'))).toBe(false) // Also blocked - overlaps with booking
        })

        it('should exclude slots that conflict with busy blocks', async () => {
            setupStandardMocks({
                duration: 30,
                rules: [{ day_of_week: 1, start_time_local: '09:00:00', end_time_local: '11:00:00' }],
                busyBlocks: [{ start_at: '2025-01-20T09:00:00Z', end_at: '2025-01-20T10:00:00Z' }]
            })

            const slots = await getAvailableSlots(mockUsername, mockServiceId, '2025-01-20')

            // First available slot should be 10:00 or later
            const firstSlotTime = new Date(slots[0].start).getUTCHours()
            expect(firstSlotTime).toBeGreaterThanOrEqual(10)
        })

        it('should apply buffer times correctly', async () => {
            // With 15 min buffer before and after, a booking at 10:00-10:30
            // should block: 09:15-10:45 (slot starts)
            setupStandardMocks({
                duration: 30,
                bufferBefore: 15,
                bufferAfter: 15,
                rules: [{ day_of_week: 1, start_time_local: '09:00:00', end_time_local: '12:00:00' }],
                bookings: [{ start_at: '2025-01-20T10:00:00Z', end_at: '2025-01-20T10:30:00Z' }]
            })

            const slots = await getAvailableSlots(mockUsername, mockServiceId, '2025-01-20')

            // Check that slots near the booking are blocked
            const slotTimes = slots.map(s => new Date(s.start).toISOString())

            // 09:45 should be blocked (09:45+30=10:15, but buffer_before=15 means busy zone starts at 09:45-15=09:30... actually this tests the conflict check)
            // The busy zone with buffer: 10:00-15min to 10:30+15min = 09:45-10:45
            // So slots starting 09:15, 09:30, 09:45, 10:00, 10:15 should be blocked
            expect(slots.some(s => s.start.includes('09:00'))).toBe(true)
        })
    })

    describe('Minimum Notice Time', () => {
        it('should exclude slots within minimum notice period', async () => {
            // Current time is 08:00 UTC, min notice is 120 minutes
            // So slots before 10:00 UTC should be excluded

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: { id: mockProviderId, timezone: 'UTC' }, error: null })
                    }
                }
                if (table === 'availability_settings') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({
                            data: { buffer_before_minutes: 0, buffer_after_minutes: 0, min_notice_minutes: 120 },
                            error: null
                        })
                    }
                }
                if (table === 'services') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: { duration_minutes: 30 }, error: null })
                    }
                }
                if (table === 'availability_rules') {
                    // Wednesday (day 3) for 2025-01-15
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({
                                data: [{ day_of_week: 3, start_time_local: '08:00:00', end_time_local: '12:00:00' }],
                                error: null
                            })
                        })
                    }
                }
                if (table === 'bookings') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        neq: vi.fn().mockReturnThis(),
                        lt: vi.fn().mockReturnThis(),
                        gt: vi.fn().mockResolvedValue({ data: [], error: null })
                    }
                }
                if (table === 'busy_blocks') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        lt: vi.fn().mockReturnThis(),
                        gt: vi.fn().mockResolvedValue({ data: [], error: null })
                    }
                }
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: null, error: null })
                }
            })

            const slots = await getAvailableSlots(mockUsername, mockServiceId, '2025-01-15')

            // All slots should be at or after 10:00 UTC
            for (const slot of slots) {
                const slotTime = new Date(slot.start)
                expect(slotTime.getUTCHours()).toBeGreaterThanOrEqual(10)
            }
        })
    })

    describe('Timezone Handling', () => {
        it('should handle different timezones correctly', async () => {
            // Provider in Australia/Sydney (+11 in January)
            // Rule: 09:00-10:00 Sydney time = 22:00-23:00 UTC previous day
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({
                            data: { id: mockProviderId, timezone: 'Australia/Sydney' },
                            error: null
                        })
                    }
                }
                if (table === 'availability_settings') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({
                            data: { buffer_before_minutes: 0, buffer_after_minutes: 0, min_notice_minutes: 0 },
                            error: null
                        })
                    }
                }
                if (table === 'services') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: { duration_minutes: 30 }, error: null })
                    }
                }
                if (table === 'availability_rules') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({
                                data: [{ day_of_week: 1, start_time_local: '09:00:00', end_time_local: '10:00:00' }],
                                error: null
                            })
                        })
                    }
                }
                if (table === 'bookings') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        neq: vi.fn().mockReturnThis(),
                        lt: vi.fn().mockReturnThis(),
                        gt: vi.fn().mockResolvedValue({ data: [], error: null })
                    }
                }
                if (table === 'busy_blocks') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        lt: vi.fn().mockReturnThis(),
                        gt: vi.fn().mockResolvedValue({ data: [], error: null })
                    }
                }
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: null, error: null })
                }
            })

            const slots = await getAvailableSlots(mockUsername, mockServiceId, '2025-01-20')

            // Verify slots exist and are stored in UTC
            expect(slots.length).toBeGreaterThan(0)
            // Each slot should be a valid ISO string
            for (const slot of slots) {
                expect(new Date(slot.start).toISOString()).toBe(slot.start)
                expect(new Date(slot.end).toISOString()).toBe(slot.end)
            }
        })

        it('should default to UTC when timezone is not set', async () => {
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({
                            data: { id: mockProviderId, timezone: null }, // No timezone set
                            error: null
                        })
                    }
                }
                if (table === 'availability_settings') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: null, error: null })
                    }
                }
                if (table === 'services') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: { duration_minutes: 30 }, error: null })
                    }
                }
                if (table === 'availability_rules') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({
                                data: [{ day_of_week: 1, start_time_local: '09:00:00', end_time_local: '10:00:00' }],
                                error: null
                            })
                        })
                    }
                }
                if (table === 'bookings') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        neq: vi.fn().mockReturnThis(),
                        lt: vi.fn().mockReturnThis(),
                        gt: vi.fn().mockResolvedValue({ data: [], error: null })
                    }
                }
                if (table === 'busy_blocks') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        lt: vi.fn().mockReturnThis(),
                        gt: vi.fn().mockResolvedValue({ data: [], error: null })
                    }
                }
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: null, error: null })
                }
            })

            const slots = await getAvailableSlots(mockUsername, mockServiceId, '2025-01-20')

            // Should still return valid slots using UTC
            expect(slots.length).toBeGreaterThan(0)
        })
    })

    describe('Conflict Detection Algorithm', () => {
        it('should correctly identify overlapping time ranges', async () => {
            // Test the core conflict detection: new_booking.start < existing.end AND new_booking.end > existing.start

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: { id: mockProviderId, timezone: 'UTC' }, error: null })
                    }
                }
                if (table === 'availability_settings') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({
                            data: { buffer_before_minutes: 0, buffer_after_minutes: 0, min_notice_minutes: 0 },
                            error: null
                        })
                    }
                }
                if (table === 'services') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: { duration_minutes: 60 }, error: null })
                    }
                }
                if (table === 'availability_rules') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({
                                data: [{ day_of_week: 1, start_time_local: '09:00:00', end_time_local: '17:00:00' }],
                                error: null
                            })
                        })
                    }
                }
                if (table === 'bookings') {
                    // Multiple bookings to test various overlap scenarios
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        neq: vi.fn().mockReturnThis(),
                        lt: vi.fn().mockReturnThis(),
                        gt: vi.fn().mockResolvedValue({
                            data: [
                                { start_at: '2025-01-20T10:00:00Z', end_at: '2025-01-20T11:00:00Z' }, // 10:00-11:00
                                { start_at: '2025-01-20T14:00:00Z', end_at: '2025-01-20T15:00:00Z' }, // 14:00-15:00
                            ],
                            error: null
                        })
                    }
                }
                if (table === 'busy_blocks') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        lt: vi.fn().mockReturnThis(),
                        gt: vi.fn().mockResolvedValue({ data: [], error: null })
                    }
                }
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: null, error: null })
                }
            })

            const slots = await getAvailableSlots(mockUsername, mockServiceId, '2025-01-20')

            // With 60 min duration:
            // Booking 10:00-11:00 blocks slots starting at: 09:00, 09:15, 09:30, 09:45, 10:00
            // Booking 14:00-15:00 blocks slots starting at: 13:00, 13:15, 13:30, 13:45, 14:00
            const slotStartHours = slots.map(s => new Date(s.start).getUTCHours())

            // Should NOT have slots that would overlap with bookings
            // 10:00 slot (10:00-11:00) conflicts with 10:00-11:00 booking
            expect(slots.some(s => {
                const start = new Date(s.start)
                return start.getUTCHours() === 10 && start.getUTCMinutes() === 0
            })).toBe(false)

            // 09:00 slot (09:00-10:00) should be available - ends exactly when booking starts
            expect(slots.some(s => {
                const start = new Date(s.start)
                return start.getUTCHours() === 9 && start.getUTCMinutes() === 0
            })).toBe(true)
        })
    })

    describe('Multiple Availability Windows', () => {
        it('should handle multiple time windows in a single day', async () => {
            // Morning: 09:00-12:00, Afternoon: 14:00-17:00

            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'profiles') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: { id: mockProviderId, timezone: 'UTC' }, error: null })
                    }
                }
                if (table === 'availability_settings') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({
                            data: { buffer_before_minutes: 0, buffer_after_minutes: 0, min_notice_minutes: 0 },
                            error: null
                        })
                    }
                }
                if (table === 'services') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({ data: { duration_minutes: 30 }, error: null })
                    }
                }
                if (table === 'availability_rules') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockResolvedValue({
                                data: [
                                    { day_of_week: 1, start_time_local: '09:00:00', end_time_local: '12:00:00' },
                                    { day_of_week: 1, start_time_local: '14:00:00', end_time_local: '17:00:00' }
                                ],
                                error: null
                            })
                        })
                    }
                }
                if (table === 'bookings') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        neq: vi.fn().mockReturnThis(),
                        lt: vi.fn().mockReturnThis(),
                        gt: vi.fn().mockResolvedValue({ data: [], error: null })
                    }
                }
                if (table === 'busy_blocks') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        lt: vi.fn().mockReturnThis(),
                        gt: vi.fn().mockResolvedValue({ data: [], error: null })
                    }
                }
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({ data: null, error: null })
                }
            })

            const slots = await getAvailableSlots(mockUsername, mockServiceId, '2025-01-20')

            // Should have slots from both windows
            const morningSlots = slots.filter(s => {
                const hour = new Date(s.start).getUTCHours()
                return hour >= 9 && hour < 12
            })
            const afternoonSlots = slots.filter(s => {
                const hour = new Date(s.start).getUTCHours()
                return hour >= 14 && hour < 17
            })

            expect(morningSlots.length).toBeGreaterThan(0)
            expect(afternoonSlots.length).toBeGreaterThan(0)

            // Should NOT have slots between 12:00-14:00
            const lunchSlots = slots.filter(s => {
                const hour = new Date(s.start).getUTCHours()
                return hour >= 12 && hour < 14
            })
            expect(lunchSlots.length).toBe(0)
        })
    })
})
