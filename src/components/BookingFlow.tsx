'use client'

import { useState } from 'react'
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addDays, getDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Clock, Check } from 'lucide-react'
import { fetchSlots } from '@/app/actions'
import { sendConfirmationEmail } from '@/app/actions/emails'
import { createClient } from '@/utils/supabase/client' // For submitting the booking
import { createBookingAction } from '@/app/actions/booking'
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
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
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
    const [error, setError] = useState<string | null>(null)

    // Calendar Helpers
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const startDayIndex = getDay(monthStart) // 0 (Sun) - 6 (Sat)
    const emptyDays = Array(startDayIndex).fill(null)

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
            setError('Please enter your name')
            return
        }
        if (!clientPhone.trim()) {
            setError('Please enter your phone number')
            return
        }

        setSubmitting(true)
        setError(null)

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

            // Trigger Email
            await sendConfirmationEmail(data.id)

            setCompleted(true)
        } catch (e: any) {
            console.error(e)
            setError(e.message || 'Booking failed')
        } finally {
            setSubmitting(false)
        }
    }

    if (completed) {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-4 animate-in fade-in zoom-in duration-300">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-bold text-center">Booking Confirmed!</h2>
                <p className="text-gray-500 text-center">Check your email for details.</p>
                <button onClick={() => window.location.reload()} className="text-blue-600 underline">
                    Book another
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto bg-white dark:bg-gray-900 min-h-screen sm:min-h-0 sm:rounded-xl sm:shadow-lg sm:my-8 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-lg">
                        {profile.full_name?.[0] || profile.username[0].toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold">{profile.full_name || profile.username}</h1>
                        <p className="text-sm text-gray-500">Select a time to meet</p>
                    </div>
                </div>
            </div>

            {/* Steps */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">

                {/* Service Selection */}
                {!selectedService && (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Select a Service</h3>
                        <div className="grid gap-3">
                            {services.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setSelectedService(s)}
                                    className="flex items-center justify-between p-4 border rounded-xl hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all text-left group"
                                >
                                    <span className="font-medium group-hover:text-blue-700">{s.name}</span>
                                    <div className="flex items-center text-gray-400 group-hover:text-blue-500">
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
                            <button onClick={() => setSelectedService(null)} className="text-sm text-gray-400 hover:text-gray-600 mb-2">
                                ← Back to services
                            </button>
                        )}

                        {/* Calendar */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-medium">{format(currentMonth, 'MMMM yyyy')}</h3>
                                <div className="flex space-x-1">
                                    <button onClick={() => setCurrentMonth(prev => addMonths(prev, -1))} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-5 h-5" /></button>
                                    <button onClick={() => setCurrentMonth(prev => addMonths(prev, 1))} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight className="w-5 h-5" /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 text-center text-xs text-gray-400 mb-2">
                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {emptyDays.map((_, i) => <div key={`empty-${i}`} />)}
                                {days.map(day => {
                                    const isSelected = selectedDate && isSameDay(day, selectedDate)
                                    const isPast = day < new Date(new Date().setHours(0, 0, 0, 0))
                                    return (
                                        <button
                                            key={day.toISOString()}
                                            disabled={isPast}
                                            onClick={() => handleDateSelect(day)}
                                            className={clsx(
                                                "h-10 rounded-full flex items-center justify-center text-sm transition-all",
                                                isSelected ? "bg-black text-white dark:bg-white dark:text-black" : "hover:bg-gray-100 dark:hover:bg-gray-800",
                                                isPast && "text-gray-300 cursor-not-allowed",
                                                isToday(day) && !isSelected && "text-blue-600 font-bold"
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
                            <div className="space-y-3 animate-in fade-in pt-4 border-t border-gray-100 dark:border-gray-800">
                                <h4 className="text-sm font-medium text-gray-500">Available times for {format(selectedDate, 'EEEE, MMM d')}</h4>

                                {loadingSlots ? (
                                    <div className="flex justify-center p-4"><div className="w-5 h-5 border-2 border-gray-300 border-t-black rounded-full animate-spin" /></div>
                                ) : slots.length === 0 ? (
                                    <div className="text-center text-gray-400 text-sm py-4">No slots available</div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {slots.map(slot => (
                                            <button
                                                key={slot.start}
                                                onClick={() => setSelectedSlot(slot)}
                                                className="px-3 py-2 text-sm border rounded-lg hover:border-black dark:hover:border-white transition-all text-center"
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

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
                        )}

                        <button
                            onClick={handleBooking}
                            disabled={submitting || !clientName || !clientEmail}
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
