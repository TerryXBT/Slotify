'use client'

import { useState } from 'react'
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parse, addMinutes, isBefore, startOfDay, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Globe } from 'lucide-react'

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
    const getAvailableTimesForDate = (date: Date) => {
        const dayOfWeek = date.getDay()

        // If no availability rules, default to 8am-8pm
        if (availability.length === 0) {
            const times: string[] = []
            const startTime = parse('08:00:00', 'HH:mm:ss', date)
            const endTime = parse('20:00:00', 'HH:mm:ss', date)

            let current = startTime
            while (isBefore(current, endTime)) {
                times.push(format(current, 'h:mma'))
                current = addMinutes(current, service.duration_minutes)
            }
            return times
        }

        const dayAvailability = availability.filter(a => a.day_of_week === dayOfWeek)

        if (dayAvailability.length === 0) return []

        const times: string[] = []
        dayAvailability.forEach(slot => {
            const startTime = parse(slot.start_time_local, 'HH:mm:ss', date)
            const endTime = parse(slot.end_time_local, 'HH:mm:ss', date)

            let current = startTime
            while (isBefore(current, endTime)) {
                times.push(format(current, 'h:mma'))
                current = addMinutes(current, service.duration_minutes)
            }
        })

        return times
    }

    const isDateAvailable = (date: Date) => {
        // If no availability rules at all, all dates are available
        if (availability.length === 0) return date >= startOfDay(new Date())

        // Otherwise, check if this day of week has rules
        const dayOfWeek = date.getDay()
        return availability.some(a => a.day_of_week === dayOfWeek) && date >= startOfDay(new Date())
    }

    // Generate calendar days
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const handleDateSelect = (date: Date) => {
        if (!isDateAvailable(date)) return
        setSelectedDate(date)
        setSelectedTime(null)
        setStep('time')
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
            const timeMatch = selectedTime.match(/(\d+):(\d+)(am|pm)/)
            if (!timeMatch) return

            let hours = parseInt(timeMatch[1])
            const minutes = parseInt(timeMatch[2])
            const period = timeMatch[3]

            if (period === 'pm' && hours !== 12) hours += 12
            if (period === 'am' && hours === 12) hours = 0

            startAt.setHours(hours, minutes, 0)
            const endAt = addMinutes(startAt, service.duration_minutes)

            const response = await fetch('/api/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider_id: providerId,
                    service_id: service.id,
                    client_name: clientName,
                    client_email: clientEmail,
                    client_phone: clientPhone,
                    start_at: startAt.toISOString(),
                    end_at: endAt.toISOString(),
                    notes
                })
            })

            if (response.ok) {
                alert('Booking confirmed! You will receive a confirmation email.')
                window.location.href = '/'
            } else {
                const data = await response.json()
                alert(data.error || 'Booking failed. Please try again.')
            }
        } catch (error) {
            alert('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const availableTimes = selectedDate ? getAvailableTimesForDate(selectedDate) : []

    return (
        <div>
            {/* Step 1: Select Date */}
            {step === 'date' && (
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-6">
                        Select a Day
                    </h2>

                    {/* Month Navigation */}
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {format(currentMonth, 'MMMM yyyy')}
                        </h3>
                        <button
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="mb-4">
                        <div className="grid grid-cols-7 gap-2 mb-2">
                            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                                <div key={day} className="text-center text-xs font-semibold text-gray-600 dark:text-gray-400 py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-2">
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
                                            aspect-square rounded-full flex items-center justify-center text-sm font-semibold transition-all
                                            ${available && !isPast
                                                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                                                : 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
                                            }
                                            ${isToday(date) && 'ring-2 ring-blue-500'}
                                        `}
                                    >
                                        {format(date, 'd')}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                        <div className="flex items-center justify-center gap-2">
                            <Globe className="w-4 h-4" />
                            <span>Time Zone: {Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
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

                    {availableTimes.length > 0 ? (
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
