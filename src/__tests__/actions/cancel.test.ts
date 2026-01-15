import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock redirect and revalidatePath
vi.mock('next/navigation', () => ({
    redirect: vi.fn()
}))

vi.mock('next/cache', () => ({
    revalidatePath: vi.fn()
}))

// Mock Supabase server client
const mockGetUser = vi.fn()
const mockFrom = vi.fn()
const mockSupabase = {
    auth: {
        getUser: mockGetUser
    },
    from: mockFrom
}

vi.mock('@/utils/supabase/server', () => ({
    createClient: () => Promise.resolve(mockSupabase)
}))

// Import after mocking
import { cancelBookingAsPro, cancelBookingViaToken } from '@/app/actions/cancel'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

describe('cancelBookingAsPro', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should cancel booking when user is owner', async () => {
        const userId = 'user-123'
        const bookingId = 'booking-456'

        mockGetUser.mockResolvedValue({
            data: { user: { id: userId } }
        })

        mockFrom.mockImplementation((table: string) => {
            if (table === 'bookings') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: { provider_id: userId },
                                error: null
                            })
                        })
                    }),
                    update: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ error: null })
                    })
                }
            }
            return {}
        })

        const formData = new FormData()
        formData.set('bookingId', bookingId)

        await cancelBookingAsPro(formData)

        expect(revalidatePath).toHaveBeenCalledWith('/app/today')
        expect(revalidatePath).toHaveBeenCalledWith(`/app/bookings/${bookingId}`)
        expect(redirect).toHaveBeenCalledWith('/app/today')
    })

    it('should throw error when user is not authenticated', async () => {
        mockGetUser.mockResolvedValue({
            data: { user: null }
        })

        const formData = new FormData()
        formData.set('bookingId', 'booking-456')

        await expect(cancelBookingAsPro(formData)).rejects.toThrow('Not authenticated')
    })

    it('should throw error when booking ID is missing', async () => {
        mockGetUser.mockResolvedValue({
            data: { user: { id: 'user-123' } }
        })

        const formData = new FormData()
        // No bookingId set

        await expect(cancelBookingAsPro(formData)).rejects.toThrow('Missing booking ID')
    })

    it('should throw error when user is not the owner', async () => {
        mockGetUser.mockResolvedValue({
            data: { user: { id: 'user-123' } }
        })

        mockFrom.mockImplementation((table: string) => {
            if (table === 'bookings') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: { provider_id: 'different-user' }, // Different owner
                                error: null
                            })
                        })
                    })
                }
            }
            return {}
        })

        const formData = new FormData()
        formData.set('bookingId', 'booking-456')

        await expect(cancelBookingAsPro(formData)).rejects.toThrow('Access denied')
    })

    it('should throw error when booking not found', async () => {
        mockGetUser.mockResolvedValue({
            data: { user: { id: 'user-123' } }
        })

        mockFrom.mockImplementation((table: string) => {
            if (table === 'bookings') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: null,
                                error: null
                            })
                        })
                    })
                }
            }
            return {}
        })

        const formData = new FormData()
        formData.set('bookingId', 'nonexistent')

        await expect(cancelBookingAsPro(formData)).rejects.toThrow('Access denied')
    })

    it('should throw error when update fails', async () => {
        const userId = 'user-123'

        mockGetUser.mockResolvedValue({
            data: { user: { id: userId } }
        })

        mockFrom.mockImplementation((table: string) => {
            if (table === 'bookings') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({
                                data: { provider_id: userId },
                                error: null
                            })
                        })
                    }),
                    update: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } })
                    })
                }
            }
            return {}
        })

        const formData = new FormData()
        formData.set('bookingId', 'booking-456')

        await expect(cancelBookingAsPro(formData)).rejects.toThrow('Failed to cancel booking')
    })
})

describe('cancelBookingViaToken', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should cancel booking with valid token', async () => {
        const token = 'valid-token-123'
        const bookingId = 'booking-456'

        mockFrom.mockImplementation((table: string) => {
            if (table === 'action_tokens') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({
                                    data: {
                                        token,
                                        booking_id: bookingId,
                                        type: 'cancel',
                                        expires_at: new Date(Date.now() + 86400000).toISOString() // Future date
                                    },
                                    error: null
                                })
                            })
                        })
                    }),
                    delete: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ error: null })
                    })
                }
            }
            if (table === 'bookings') {
                return {
                    update: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ error: null })
                    })
                }
            }
            return {}
        })

        const result = await cancelBookingViaToken(token)

        expect(result.success).toBe(true)
    })

    it('should return error for invalid token', async () => {
        mockFrom.mockImplementation((table: string) => {
            if (table === 'action_tokens') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({
                                    data: null,
                                    error: null
                                })
                            })
                        })
                    })
                }
            }
            return {}
        })

        const result = await cancelBookingViaToken('invalid-token')

        expect(result.error).toBe('Invalid or expired token')
    })

    it('should return error for expired token', async () => {
        mockFrom.mockImplementation((table: string) => {
            if (table === 'action_tokens') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({
                                    data: {
                                        token: 'expired-token',
                                        booking_id: 'booking-456',
                                        type: 'cancel',
                                        expires_at: new Date(Date.now() - 86400000).toISOString() // Past date
                                    },
                                    error: null
                                })
                            })
                        })
                    })
                }
            }
            return {}
        })

        const result = await cancelBookingViaToken('expired-token')

        expect(result.error).toBe('Invalid or expired token')
    })

    it('should return error when booking update fails', async () => {
        mockFrom.mockImplementation((table: string) => {
            if (table === 'action_tokens') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({
                                    data: {
                                        token: 'valid-token',
                                        booking_id: 'booking-456',
                                        type: 'cancel',
                                        expires_at: new Date(Date.now() + 86400000).toISOString()
                                    },
                                    error: null
                                })
                            })
                        })
                    })
                }
            }
            if (table === 'bookings') {
                return {
                    update: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ error: { message: 'Update failed' } })
                    })
                }
            }
            return {}
        })

        const result = await cancelBookingViaToken('valid-token')

        expect(result.error).toBe('Failed to cancel')
    })

    it('should delete token after successful cancellation (one-time use)', async () => {
        const deleteEq = vi.fn().mockResolvedValue({ error: null })
        const deleteFn = vi.fn().mockReturnValue({ eq: deleteEq })

        mockFrom.mockImplementation((table: string) => {
            if (table === 'action_tokens') {
                return {
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            eq: vi.fn().mockReturnValue({
                                single: vi.fn().mockResolvedValue({
                                    data: {
                                        token: 'valid-token',
                                        booking_id: 'booking-456',
                                        type: 'cancel',
                                        expires_at: new Date(Date.now() + 86400000).toISOString()
                                    },
                                    error: null
                                })
                            })
                        })
                    }),
                    delete: deleteFn
                }
            }
            if (table === 'bookings') {
                return {
                    update: vi.fn().mockReturnValue({
                        eq: vi.fn().mockResolvedValue({ error: null })
                    })
                }
            }
            return {}
        })

        await cancelBookingViaToken('valid-token')

        expect(deleteFn).toHaveBeenCalled()
        expect(deleteEq).toHaveBeenCalledWith('token', 'valid-token')
    })
})
