'use client'

import { useState } from 'react'
import { startOfMonth, endOfMonth, eachDayOfInterval, isToday, addMinutes, startOfDay, addMonths, subMonths, format } from 'date-fns'
import { ChevronLeft, ChevronRight, Globe, Loader2 } from 'lucide-react'
import { getAvailableSlots } from '@/app/actions/availability'
import { createBookingAction } from '@/app/actions/booking'

interface Availability {
    day_of_week: number
    start_time_local: string
    end_time_local: string
}

interface BookingFormProps {
    service: any
    providerId: string
    providerName: string
    availability: Availability[]
}

export default function BookingForm({ service, providerId, providerName, availability }: BookingFormProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedTime, setSelectedTime] = useState<string | null>(null)
    const [step, setStep] = useState<'date' | 'time' | 'details'>('date')
    const [loading, setLoading] = useState(false)

    // Client details
    const [clientName, setClientName] = useState('')
    const [clientEmail, setClientEmail] = useState('')
    const [clientPhone, setClientPhone] = useState('')
    const [notes, setNotes] = useState('')

    // Get available times for selected date
    const [availableTimes, setAvailableTimes] = useState<string[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)

    // Generate calendar days
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const handleDateSelect = async (date: Date) => {
        // Optimistic UI update
        setSelectedDate(date)
        setSelectedTime(null)
        setStep('time')

        // Fetch slots
        setLoadingSlots(true)
        setAvailableTimes([])

        try {
            // Adjust for Client TZ -> Provider Rule matching (via simple ISO date YYYY-MM-DD)
            // Ideally we pass the full date or handle TZ explicitly.
            const dateStr = format(date, 'yyyy-MM-dd')
            const result = await getAvailableSlots(service.id, providerId, dateStr, service.duration_minutes)
            if (result.slots) {
                setAvailableTimes(result.slots)
            }
        } catch (error) {
            console.error('Failed to fetch slots', error)
        } finally {
            setLoadingSlots(false)
        }
    }

    const isDateAvailable = (date: Date) => {
        // We don't know for sure without asking server, but we can do a high-level check
        // Or we just allow clicking any future date.
        // For better UX, we could pre-fetch busy days, but for now allow clicking.
        return date >= startOfDay(new Date())
    }

    const handleTimeSelect = (time: string) => {
        setSelectedTime(time)
        setStep('details')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedDate || !selectedTime) return

        setLoading(true)

        try {
            const startAt = new Date(selectedDate)
            const timeMatch = selectedTime.match(/(\d+):(\d+)(am|pm)/i)
            if (!timeMatch) return

            let hours = parseInt(timeMatch[1])
            const minutes = parseInt(timeMatch[2])
            const period = timeMatch[3].toLowerCase()

            if (period === 'pm' && hours !== 12) hours += 12
            if (period === 'am' && hours === 12) hours = 0

            startAt.setHours(hours, minutes, 0)
            const endAt = addMinutes(startAt, service.duration_minutes)

            const result = await createBookingAction({
                provider_id: providerId,
                service_id: service.id,
                client_name: clientName,
                client_email: clientEmail,
                client_phone: clientPhone,
                start_at: startAt.toISOString(),
                // end_at is calculated server side in action, but we need start_at
                notes
            })

            if (result.success) {
                alert('Booking confirmed! You will receive a confirmation email.')
                // Redirect or show success state
                window.location.href = '/'
            } else {
                alert(result.error || 'Booking failed. Please try again.')
            }
        } catch (error) {
            alert('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div>
            {/* Step 1: Select Date */}
            {step === 'date' && (
                <div className="max-w-[300px] mx-auto">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-4">
                        Select a Day
                    </h2>

                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <h3 className="text-base font-medium text-gray-900 dark:text-white">
                            {format(currentMonth, 'MMMM yyyy')}
                        </h3>
                        <button
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="mb-4">
                        <div className="grid grid-cols-7 gap-1 mb-1">
                            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                                <div key={day} className="text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 py-1">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {/* Add empty cells for days before month starts */}
                            {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
                                <div key={`empty-${i}`} />
                            ))}

                            {calendarDays.map(date => {
                                const available = isDateAvailable(date)
                                const isPast = date < startOfDay(new Date())

                                return (
                                    <button
                                        key={date.toISOString()}
                                        onClick={() => handleDateSelect(date)}
                                        disabled={!available || isPast}
                                        className={`
                                            w-9 h-9 mx-auto rounded-full flex items-center justify-center text-xs font-medium transition-all
                                            ${available && !isPast
                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                                                : 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                                            }
                                            ${isToday(date) && 'ring-1 ring-blue-500'}
                                            ${selectedDate && date.getTime() === selectedDate.getTime() ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:text-white' : ''}
                                        `}
                                    >
                                        {format(date, 'd')}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="text-center text-xs text-gray-400 dark:text-gray-500 mt-4">
                        <div className="flex items-center justify-center gap-1.5">
                            <Globe className="w-3.5 h-3.5" />
                            <span>{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Select Time */}
            {step === 'time' && selectedDate && (
                <div>
                    <button
                        onClick={() => setStep('date')}
                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold mb-6 hover:underline"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </button>

                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {format(selectedDate, 'EEEE')}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            {format(selectedDate, 'MMMM d, yyyy')}
                        </p>
                    </div>

                    <div className="text-center mb-6">
                        <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                            <Globe className="w-4 h-4" />
                            <span className="text-sm">{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                        Select a Time
                    </h3>
                    <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
                        Duration: {service.duration_minutes} min
                    </p>

                    {loadingSlots ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
                            <Loader2 className="w-8 h-8 animate-spin mb-2" />
                            <p>Loading available slots...</p>
                        </div>
                    ) : availableTimes.length > 0 ? (
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {availableTimes.map(time => (
                                <button
                                    key={time}
                                    onClick={() => handleTimeSelect(time)}
                                    className="w-full p-4 rounded-xl border-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all font-semibold text-lg"
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                            No available times for this date
                        </div>
                    )}
                </div>
            )}

            {/* Step 3: Enter Details */}
            {step === 'details' && selectedDate && selectedTime && (
                <div>
                    <button
                        onClick={() => setStep('time')}
                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold mb-6 hover:underline"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back
                    </button>

                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
                        Enter Details
                    </h2>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-6 text-center">
                        <div className="font-semibold text-gray-900 dark:text-white mb-1">
                            {service.name}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 text-sm">
                            {selectedTime} - {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 text-sm">
                            {service.duration_minutes} minute meeting with {providerName}
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={clientName}
                                onChange={(e) => setClientName(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                required
                                value={clientEmail}
                                onChange={(e) => setClientEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="john@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Phone Number *
                            </label>
                            <input
                                type="tel"
                                required
                                value={clientPhone}
                                onChange={(e) => setClientPhone(e.target.value)}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                Additional Notes
                            </label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                placeholder="Please share anything that will help prepare for our meeting."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-full transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Scheduling...' : 'Schedule Event'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    )
}
