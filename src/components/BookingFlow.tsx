'use client'

import { useState } from 'react'
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay, isBefore, startOfDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Clock, Check } from 'lucide-react'
import { fetchSlots } from '@/app/actions'
import { sendConfirmationEmail } from '@/app/actions/emails'
import { createBookingAction } from '@/app/actions/booking'
import { toast } from '@/utils/toast'
import AddToCalendar from '@/components/AddToCalendar'
import clsx from 'clsx'

type Slot = {
    start: string
    end: string
}

type Service = {
    id: string
    name: string
    duration_minutes: number
    price_cents: number | null
    description: string | null
    location_type: string | null
    default_location: string | null
}

type Profile = {
    username: string
    full_name: string | null
    id: string
}

export default function BookingFlow({
    profile,
    services,
    preSelectedServiceId
}: {
    profile: Profile
    services: Service[]
    preSelectedServiceId?: string
}) {
    const [selectedService, setSelectedService] = useState<Service | null>(() => {
        if (preSelectedServiceId) {
            return services.find(s => s.id === preSelectedServiceId) || null
        }
        return services.length === 1 ? services[0] : null
    })
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [currentMonth, setCurrentMonth] = useState<Date>(() => {
        // Always start with current month, never in the past
        return startOfMonth(new Date())
    })
    const [slots, setSlots] = useState<Slot[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)
    const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)

    // Booking Form State
    const [clientName, setClientName] = useState('')
    const [clientEmail, setClientEmail] = useState('')
    const [clientPhone, setClientPhone] = useState('')
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [completed, setCompleted] = useState(false)
    const [bookingDetails, setBookingDetails] = useState<{
        serviceName: string
        startTime: Date
        endTime: Date
        location?: string
    } | null>(null)

    // Calendar Helpers
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const startDayIndex = getDay(monthStart) // 0 (Sun) - 6 (Sat)
    const emptyDays = Array(startDayIndex).fill(null)

    // Month navigation limits
    const today = new Date()
    const currentMonthStart = startOfMonth(today)
    const maxMonth = addMonths(currentMonthStart, 2) // Can view up to 3 months (current + 2 more)
    const displayedMonthStart = startOfMonth(currentMonth)

    // Can go previous only if displayed month is after current month
    const canGoPrevious = isBefore(currentMonthStart, displayedMonthStart)
    // Can go next only if displayed month is before the max month
    const canGoNext = isBefore(displayedMonthStart, maxMonth)

    const handleDateSelect = async (date: Date) => {
        setSelectedDate(date)
        setSelectedSlot(null)
        setSlots([])

        if (selectedService) {
            setLoadingSlots(true)
            const dateStr = format(date, 'yyyy-MM-dd')
            const res = await fetchSlots(profile.username, selectedService.id, dateStr)
            if (res.success && res.slots) {
                setSlots(res.slots)
            } else {
                console.error(res.error)
            }
            setLoadingSlots(false)
        }
    }

    const handleBooking = async () => {
        if (!selectedService || !selectedSlot) return

        // Validate required fields
        if (!clientName.trim()) {
            toast.error('Please enter your name')
            return
        }
        if (!clientPhone.trim()) {
            toast.error('Please enter your phone number')
            return
        }

        setSubmitting(true)

        try {
            // Call Server Action
            const result = await createBookingAction({
                provider_id: profile.id,
                service_id: selectedService.id,
                start_at: selectedSlot.start,
                client_name: clientName,
                client_email: clientEmail,
                client_phone: clientPhone,
                notes: notes
            })

            if (result.error) {
                throw new Error(result.error)
            }

            const data = result.data
            if (!data) throw new Error('Booking created but no data returned')

            console.log('[CLIENT] About to send confirmation email:', { bookingId: data.id, cancelToken: result.cancelToken })

            // Trigger Email with cancel token
            await sendConfirmationEmail(data.id, result.cancelToken)

            console.log('[CLIENT] Email sent successfully')

            // Store booking details for calendar export
            const startTime = new Date(selectedSlot.start)
            const endTime = new Date(startTime.getTime() + selectedService.duration_minutes * 60000)

            setBookingDetails({
                serviceName: selectedService.name,
                startTime,
                endTime,
                location: selectedService.location_type === 'online'
                    ? 'Online'
                    : selectedService.default_location || undefined
            })

            setCompleted(true)
            toast.success('Booking confirmed! Check your email for details.')
        } catch (e: unknown) {
            console.error(e)
            const errorMessage = e instanceof Error ? e.message : 'Booking failed. Please try again.'
            toast.error(errorMessage)
        } finally {
            setSubmitting(false)
        }
    }

    if (completed && bookingDetails) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
                    <p className="text-gray-500">Check your email for details.</p>
                </div>

                <AddToCalendar
                    event={{
                        title: `${bookingDetails.serviceName} with ${profile.full_name || profile.username}`,
                        description: `Booking for ${bookingDetails.serviceName}`,
                        location: bookingDetails.location,
                        startTime: bookingDetails.startTime,
                        endTime: bookingDetails.endTime,
                    }}
                />

                <button
                    onClick={() => window.location.reload()}
                    className="text-blue-600 hover:text-blue-700 underline transition-colors"
                >
                    Book another
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto bg-[#1e293b] min-h-screen sm:min-h-0 sm:rounded-xl sm:shadow-lg sm:my-8 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-lg">
                        {profile.full_name?.[0] || profile.username[0].toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-white">{profile.full_name || profile.username}</h1>
                        <p className="text-sm text-gray-400">Select a time to meet</p>
                    </div>
                </div>

                {/* Service Info - Show when service is selected */}
                {selectedService && (
                    <div className="mt-4 p-4 bg-[#2d3748] rounded-lg space-y-2">
                        <h2 className="font-semibold text-lg text-white">{selectedService.name}</h2>

                        {selectedService.description && (
                            <p className="text-sm text-gray-300">{selectedService.description}</p>
                        )}

                        <div className="flex flex-wrap gap-3 text-sm">
                            <div className="flex items-center text-gray-300">
                                <Clock className="w-4 h-4 mr-1" />
                                <span>{selectedService.duration_minutes} minutes</span>
                            </div>

                            {selectedService.price_cents && selectedService.price_cents > 0 && (
                                <div className="flex items-center text-gray-300">
                                    <span className="mr-1">$</span>
                                    <span>{(selectedService.price_cents / 100).toFixed(2)}</span>
                                </div>
                            )}

                            {selectedService.location_type && (
                                <div className="flex items-center text-gray-300">
                                    <span className="capitalize">{selectedService.location_type}</span>
                                    {selectedService.location_type !== 'online' && selectedService.default_location && (
                                        <span className="ml-1">• {selectedService.default_location}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Steps */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">

                {/* Service Selection */}
                {!selectedService && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-white">Select a Service</h3>
                        <div className="grid gap-3">
                            {services.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setSelectedService(s)}
                                    className="flex items-center justify-between p-4 border border-gray-600 rounded-xl hover:border-blue-400 hover:bg-blue-900/30 transition-all text-left group"
                                >
                                    <span className="font-medium text-white group-hover:text-blue-300">{s.name}</span>
                                    <div className="flex items-center text-gray-400 group-hover:text-blue-400">
                                        <Clock className="w-4 h-4 mr-1" />
                                        <span className="text-sm">{s.duration_minutes}m</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Date & Time Selection */}
                {selectedService && !selectedSlot && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300">

                        {/* Back to Service */}
                        {services.length > 1 && (
                            <button onClick={() => setSelectedService(null)} className="text-sm text-gray-400 hover:text-gray-200 mb-2">
                                ← Back to services
                            </button>
                        )}

                        {/* Calendar */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium text-white">{format(currentMonth, 'MMMM yyyy')}</h3>
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => setCurrentMonth(prev => addMonths(prev, -1))}
                                        disabled={!canGoPrevious}
                                        className={clsx(
                                            "p-1 rounded-full transition-all",
                                            canGoPrevious
                                                ? "hover:bg-gray-700 text-gray-300"
                                                : "text-gray-600 cursor-not-allowed opacity-40"
                                        )}
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                                        disabled={!canGoNext}
                                        className={clsx(
                                            "p-1 rounded-full transition-all",
                                            canGoNext
                                                ? "hover:bg-gray-700 text-gray-300"
                                                : "text-gray-600 cursor-not-allowed opacity-40"
                                        )}
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-2">
                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {emptyDays.map((_, i) => <div key={`empty-${i}`} />)}
                                {days.map(day => {
                                    const isSelected = selectedDate && isSameDay(day, selectedDate)
                                    const isPast = isBefore(startOfDay(day), startOfDay(new Date()))
                                    const isTodayDate = isToday(day)
                                    return (
                                        <button
                                            key={day.toISOString()}
                                            disabled={isPast}
                                            onClick={() => handleDateSelect(day)}
                                            className={clsx(
                                                "w-10 h-10 rounded-full flex items-center justify-center text-sm transition-all",
                                                isSelected
                                                    ? "bg-white text-[#1e293b] font-semibold"
                                                    : isPast
                                                        ? "text-gray-700 cursor-not-allowed opacity-30"
                                                        : "hover:bg-gray-700 text-white",
                                                isTodayDate && !isSelected && !isPast && "text-blue-400 font-bold"
                                            )}
                                        >
                                            {format(day, 'd')}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Slots */}
                        {selectedDate && (
                            <div className="space-y-3 animate-in fade-in pt-4 border-t border-gray-700">
                                <h4 className="text-sm font-medium text-gray-400">Available times for {format(selectedDate, 'EEEE, MMM d')}</h4>

                                {loadingSlots ? (
                                    <div className="flex justify-center p-4"><div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin" /></div>
                                ) : slots.length === 0 ? (
                                    <div className="text-center text-gray-400 text-sm py-4">No slots available</div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {slots.map(slot => (
                                            <button
                                                key={slot.start}
                                                onClick={() => setSelectedSlot(slot)}
                                                className="px-3 py-2 text-sm border border-gray-600 rounded-lg hover:border-blue-400 hover:bg-blue-900/30 transition-all text-center text-white font-medium"
                                            >
                                                {format(new Date(slot.start), 'h:mm a')}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Confirmation Form */}
                {selectedSlot && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                        <button onClick={() => setSelectedSlot(null)} className="text-sm text-gray-400 hover:text-gray-600">
                            ← Back to times
                        </button>

                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl space-y-2">
                            <div className="font-semibold text-lg">{selectedService?.name}</div>
                            <div className="flex text-sm text-gray-500 space-x-4">
                                <div className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {selectedService?.duration_minutes} mins</div>
                            </div>
                            <div className="text-blue-600 font-medium">
                                {format(new Date(selectedSlot.start), 'EEEE, MMMM d')} at {format(new Date(selectedSlot.start), 'h:mm a')}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <input
                                    type="text"
                                    value={clientName}
                                    onChange={e => setClientName(e.target.value)}
                                    className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Your Name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email (Optional)</label>
                                <input
                                    type="email"
                                    value={clientEmail}
                                    onChange={e => setClientEmail(e.target.value)}
                                    className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="you@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Phone Number</label>
                                <input
                                    type="tel"
                                    value={clientPhone}
                                    onChange={e => setClientPhone(e.target.value)}
                                    required
                                    className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="+1 234 567 890"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    className="w-full p-2 border rounded-lg dark:bg-gray-900 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Anything needed to prepare?"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleBooking}
                            disabled={submitting || !clientName || !clientPhone}
                            className="w-full bg-black text-white dark:bg-white dark:text-black py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {submitting ? 'Confirming...' : 'Confirm Booking'}
                        </button>
                    </div>
                )}

            </div>
        </div>
    )
}
