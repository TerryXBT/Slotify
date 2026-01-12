'use client'

import { useState, useActionState } from 'react'
import { format } from 'date-fns'
import RescheduleCalendar from './RescheduleCalendar'
import TimeSlotSelector from './TimeSlotSelector'
import { getAvailableSlotsForReschedule } from '@/app/actions/availability'
import { directReschedule } from './actions'
import { Loader2, Calendar } from 'lucide-react'

interface RescheduleFormClientProps {
    bookingId: string
    providerId: string
    serviceId: string
    durationMinutes: number
}

export default function RescheduleFormClient({
    bookingId,
    providerId,
    serviceId,
    durationMinutes
}: RescheduleFormClientProps) {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [availableSlots, setAvailableSlots] = useState<Array<{ start: string; end: string }>>([])
    const [loadingSlots, setLoadingSlots] = useState(false)
    const [state, formAction, isPending] = useActionState(directReschedule, null)

    const handleDateSelect = async (date: Date) => {
        setSelectedDate(date)
        setSelectedTime(null)
        setLoadingSlots(true)
        setAvailableSlots([])

        try {
            const dateStr = format(date, 'yyyy-MM-dd')
            const result = await getAvailableSlotsForReschedule(
                serviceId,
                providerId,
                dateStr,
                durationMinutes,
                bookingId // Exclude current booking from conflicts
            )

            if (result.slots) {
                setAvailableSlots(result.slots)
            }
        } catch (error) {
            console.error('Failed to fetch available slots:', error)
        } finally {
            setLoadingSlots(false)
        }
    }

    const handleTimeSelect = (startTime: string) => {
        setSelectedTime(startTime)
    }

    return (
        <form action={formAction} className="space-y-6">
            <input type="hidden" name="bookingId" value={bookingId} />
            {selectedTime && <input type="hidden" name="newStartAt" value={selectedTime} />}

            {/* Error Display */}
            {state?.error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-[14px] p-4">
                    <p className="text-[15px] text-red-500">{state.error}</p>
                </div>
            )}

            {/* Step 1: Select Date */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <h3 className="text-[17px] font-semibold">Select New Date</h3>
                </div>
                <RescheduleCalendar
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                />
            </div>

            {/* Step 2: Select Time (only shown after date selection) */}
            {selectedDate && (
                <div>
                    <TimeSlotSelector
                        slots={availableSlots}
                        selectedTime={selectedTime}
                        onTimeSelect={handleTimeSelect}
                        loading={loadingSlots}
                    />
                </div>
            )}

            {/* Submit Button */}
            {selectedTime && (
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center justify-center w-full bg-blue-500 text-white font-semibold text-[17px] py-[14px] rounded-[14px] active:opacity-70 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Rescheduling...
                        </>
                    ) : (
                        'Confirm Reschedule'
                    )}
                </button>
            )}
        </form>
    )
}
