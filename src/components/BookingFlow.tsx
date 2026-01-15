'use client'

import { useState } from 'react'
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, getDay, isBefore, startOfDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Clock, Check, MapPin, Video, Calendar, DollarSign } from 'lucide-react'
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
    price_negotiable?: boolean | null
    description: string | null
    location_type: string | null
    default_location: string | null
    cancellation_policy?: string | null
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
        price?: string
    } | null>(null)

    // Calendar Helpers
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const startDayIndex = getDay(monthStart)
    const emptyDays = Array(startDayIndex).fill(null)

    // Month navigation limits
    const today = new Date()
    const currentMonthStart = startOfMonth(today)
    const maxMonth = addMonths(currentMonthStart, 2)
    const displayedMonthStart = startOfMonth(currentMonth)

    const canGoPrevious = isBefore(currentMonthStart, displayedMonthStart)
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

        if (!clientName.trim()) {
            toast.error('Please enter your name')
            return
        }
        if (!clientEmail.trim()) {
            toast.error('Please enter your email address')
            return
        }
        if (!clientPhone.trim()) {
            toast.error('Please enter your phone number')
            return
        }

        setSubmitting(true)

        try {
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
                // Handle slot already booked - reset selection and refresh slots
                if (result.error.includes('blocked') || result.error.includes('Slot')) {
                    toast.error('This time slot is no longer available. Please choose another time.')
                    setSelectedSlot(null)
                    // Refresh available slots for the selected date
                    if (selectedDate) {
                        const dateStr = format(selectedDate, 'yyyy-MM-dd')
                        const res = await fetchSlots(profile.username, selectedService.id, dateStr)
                        if (res.success && res.slots) {
                            setSlots(res.slots)
                        }
                    }
                    return
                }
                throw new Error(result.error)
            }

            const data = result.data
            if (!data) throw new Error('Booking created but no data returned')

            await sendConfirmationEmail(data.id, result.cancelToken)

            const startTime = new Date(selectedSlot.start)
            const endTime = new Date(startTime.getTime() + selectedService.duration_minutes * 60000)

            setBookingDetails({
                serviceName: selectedService.name,
                startTime,
                endTime,
                location: selectedService.location_type === 'online'
                    ? 'Online'
                    : selectedService.default_location || undefined,
                price: formatPrice(selectedService)
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

    // Format price display
    const formatPrice = (service: Service) => {
        if (service.price_negotiable) return 'Price TBD'
        if (!service.price_cents || service.price_cents === 0) return 'Free'
        return `$${(service.price_cents / 100).toFixed(0)}`
    }

    // Glassmorphism card style
    const glassCard = "relative rounded-2xl overflow-hidden bg-white/[0.08] backdrop-blur-xl border border-white/[0.08]"

    if (completed && bookingDetails) {
        return (
            <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
                <div className={clsx(glassCard, "max-w-md w-full p-8")}>
                    <div className="flex flex-col items-center space-y-6 animate-in fade-in zoom-in duration-500">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                            <Check className="w-8 h-8 text-white" strokeWidth={3} />
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-semibold text-white">Booking Confirmed</h2>
                            <p className="text-gray-400">A confirmation has been sent to your email.</p>
                        </div>

                        <div className="w-full p-4 bg-white/5 rounded-xl space-y-3">
                            <div className="text-lg font-medium text-white">{bookingDetails.serviceName}</div>
                            <div className="flex items-center gap-2 text-gray-300 text-sm">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span>{format(bookingDetails.startTime, 'EEEE, MMMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300 text-sm">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span>{format(bookingDetails.startTime, 'h:mm a')} - {format(bookingDetails.endTime, 'h:mm a')}</span>
                            </div>
                            {bookingDetails.location && (
                                <div className="flex items-center gap-2 text-gray-300 text-sm">
                                    <MapPin className="w-4 h-4 text-gray-500" />
                                    <span>{bookingDetails.location}</span>
                                </div>
                            )}
                            {bookingDetails.price && bookingDetails.price !== 'Free' && (
                                <div className="flex items-center gap-2 text-gray-300 text-sm">
                                    <DollarSign className="w-4 h-4 text-gray-500" />
                                    <span>{bookingDetails.price}</span>
                                </div>
                            )}
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
                            className="text-blue-400 hover:text-blue-300 transition-colors text-sm"
                        >
                            Book another appointment
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#1a1a1a]">
            <div className="max-w-lg mx-auto pb-8">
                {/* Header */}
                <div className="sticky top-0 z-20 bg-[#1a1a1a]/80 backdrop-blur-xl border-b border-white/5">
                    <div className="px-6 py-5">
                        <div className="flex items-center gap-4">
                            {/* Avatar - Apple style solid color */}
                            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                                {profile.full_name?.[0] || profile.username[0].toUpperCase()}
                            </div>
                            <div>
                                <h1 className="text-lg font-semibold text-white">{profile.full_name || profile.username}</h1>
                                <p className="text-sm text-gray-500">Book an appointment</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-4 py-6 space-y-6">

                    {/* Service Selection */}
                    {!selectedService && (
                        <div className="space-y-3 animate-in fade-in duration-300">
                            <h3 className="text-[13px] text-gray-400 uppercase font-medium tracking-wider px-2">Select a Service</h3>
                            <div className="space-y-3">
                                {services.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => setSelectedService(s)}
                                        className={clsx(
                                            glassCard,
                                            "w-full p-4 text-left transition-all duration-200 hover:bg-white/[0.12] active:scale-[0.98]"
                                        )}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-medium text-white">{s.name}</h4>
                                            {/* Price in white */}
                                            <span className="text-white font-medium">{formatPrice(s)}</span>
                                        </div>
                                        {s.description && (
                                            <p className="text-sm text-gray-400 mb-3 line-clamp-2">{s.description}</p>
                                        )}
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                <span>{s.duration_minutes} min</span>
                                            </div>
                                            {s.location_type && (
                                                <div className="flex items-center gap-1">
                                                    {s.location_type === 'online' ? (
                                                        <Video className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <MapPin className="w-3.5 h-3.5" />
                                                    )}
                                                    <span>{s.location_type === 'online' ? 'Virtual' : s.default_location || 'In Person'}</span>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Selected Service Summary - only show when selecting date/time, hide when on booking form */}
                    {selectedService && !selectedSlot && (
                        <div className="animate-in fade-in duration-300">
                            {/* Back button */}
                            {services.length > 1 && (
                                <button
                                    onClick={() => {
                                        setSelectedService(null)
                                        setSelectedDate(null)
                                        setSlots([])
                                    }}
                                    className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors mb-4"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    All services
                                </button>
                            )}

                            {/* Service Card */}
                            <div className={clsx(glassCard, "p-4 mb-6")}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="font-medium text-white">{selectedService.name}</h2>
                                        <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5" />
                                                {selectedService.duration_minutes} min
                                            </span>
                                            {selectedService.location_type && (
                                                <span className="flex items-center gap-1">
                                                    {selectedService.location_type === 'online' ? (
                                                        <Video className="w-3.5 h-3.5" />
                                                    ) : (
                                                        <MapPin className="w-3.5 h-3.5" />
                                                    )}
                                                    {selectedService.location_type === 'online' ? 'Virtual' : selectedService.default_location || 'In Person'}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Price in white */}
                                    <span className="text-white font-semibold">
                                        {formatPrice(selectedService)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Calendar - Date Selection - MORE PROMINENT */}
                    {selectedService && !selectedSlot && (
                        <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
                            {/* Section Title */}
                            <h3 className="text-[13px] text-gray-400 uppercase font-medium tracking-wider px-2">Select a Date</h3>

                            {/* Calendar Container - More prominent styling */}
                            <div className={clsx(glassCard, "p-5 bg-white/[0.06]")}>
                                {/* Month Navigation */}
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-white">{format(currentMonth, 'MMMM yyyy')}</h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentMonth(prev => addMonths(prev, -1))}
                                            disabled={!canGoPrevious}
                                            className={clsx(
                                                "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                                                canGoPrevious
                                                    ? "bg-white/10 hover:bg-white/20 text-white active:scale-95"
                                                    : "text-gray-600 cursor-not-allowed"
                                            )}
                                        >
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                                            disabled={!canGoNext}
                                            className={clsx(
                                                "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                                                canGoNext
                                                    ? "bg-white/10 hover:bg-white/20 text-white active:scale-95"
                                                    : "text-gray-600 cursor-not-allowed"
                                            )}
                                        >
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Weekday Headers */}
                                <div className="grid grid-cols-7 mb-3">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                        <div key={d} className="text-center text-[11px] font-semibold text-gray-400 py-2">
                                            {d}
                                        </div>
                                    ))}
                                </div>

                                {/* Days Grid */}
                                <div className="grid grid-cols-7 gap-1.5">
                                    {emptyDays.map((_, i) => <div key={`empty-${i}`} className="aspect-square" />)}
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
                                                    "aspect-square rounded-xl flex items-center justify-center text-sm font-medium transition-all active:scale-90",
                                                    isSelected
                                                        ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                                                        : isPast
                                                            ? "text-gray-700 cursor-not-allowed"
                                                            : "text-white hover:bg-white/15",
                                                    isTodayDate && !isSelected && !isPast && "ring-2 ring-blue-500 text-blue-400"
                                                )}
                                            >
                                                {format(day, 'd')}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Time Slots */}
                            {selectedDate && (
                                <div className="space-y-3 animate-in fade-in duration-200">
                                    <h4 className="text-[13px] text-gray-400 uppercase font-medium tracking-wider px-2">
                                        Available Times
                                    </h4>

                                    {loadingSlots ? (
                                        <div className="flex justify-center py-8">
                                            <div className="w-5 h-5 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
                                        </div>
                                    ) : slots.length === 0 ? (
                                        <div className={clsx(glassCard, "text-center py-6 text-gray-500 text-sm")}>
                                            No available times for {format(selectedDate, 'MMMM d')}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 gap-2">
                                            {slots.map(slot => (
                                                <button
                                                    key={slot.start}
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className="px-3 py-3 bg-white/[0.08] hover:bg-blue-500 border border-white/10 hover:border-blue-500 rounded-xl text-sm font-medium text-white transition-all active:scale-95"
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

                    {/* Booking Form */}
                    {selectedSlot && (
                        <div className="space-y-5 animate-in slide-in-from-right-4 fade-in duration-300">
                            <button
                                onClick={() => setSelectedSlot(null)}
                                className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Change time
                            </button>

                            {/* Selected Time Card */}
                            <div className={clsx(glassCard, "p-4")}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-white">{selectedService?.name}</div>
                                        <div className="text-xs text-gray-400">{selectedService?.duration_minutes} minutes</div>
                                    </div>
                                </div>
                                <div className="text-blue-400 font-medium mt-3 pt-3 border-t border-white/10">
                                    {format(new Date(selectedSlot.start), 'EEEE, MMMM d')} at {format(new Date(selectedSlot.start), 'h:mm a')}
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[13px] text-gray-400 uppercase font-medium tracking-wider mb-2 px-1">Name</label>
                                    <input
                                        type="text"
                                        value={clientName}
                                        onChange={e => setClientName(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/[0.08] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.1] transition-all"
                                        placeholder="Your full name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[13px] text-gray-400 uppercase font-medium tracking-wider mb-2 px-1">Email</label>
                                    <input
                                        type="email"
                                        value={clientEmail}
                                        onChange={e => setClientEmail(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/[0.08] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.1] transition-all"
                                        placeholder="you@example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[13px] text-gray-400 uppercase font-medium tracking-wider mb-2 px-1">Phone</label>
                                    <input
                                        type="tel"
                                        value={clientPhone}
                                        onChange={e => setClientPhone(e.target.value)}
                                        className="w-full px-4 py-3 bg-white/[0.08] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.1] transition-all"
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[13px] text-gray-400 uppercase font-medium tracking-wider mb-2 px-1">
                                        Notes <span className="normal-case text-gray-600">(optional)</span>
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-white/[0.08] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.1] transition-all resize-none"
                                        placeholder="Any special requests?"
                                    />
                                </div>
                            </div>

                            {/* Cancellation Policy */}
                            {selectedService?.cancellation_policy && (
                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                                    <div className="text-[11px] font-semibold text-yellow-500 uppercase tracking-wider mb-1">Cancellation Policy</div>
                                    <div className="text-sm text-gray-300">
                                        {selectedService.cancellation_policy === '24h' && 'Free cancellation up to 24 hours before'}
                                        {selectedService.cancellation_policy === '48h' && 'Free cancellation up to 48 hours before'}
                                        {selectedService.cancellation_policy === 'no_cancel' && 'This booking is non-refundable'}
                                        {!['24h', '48h', 'no_cancel'].includes(selectedService.cancellation_policy) && selectedService.cancellation_policy}
                                    </div>
                                </div>
                            )}

                            {/* Submit Button - Apple Style */}
                            <button
                                onClick={handleBooking}
                                disabled={submitting || !clientName || !clientEmail || !clientPhone}
                                className="w-full bg-blue-500 hover:bg-blue-400 text-white py-3.5 rounded-xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-gray-600 active:scale-[0.98]"
                            >
                                {submitting ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Confirming...
                                    </span>
                                ) : (
                                    'Confirm Booking'
                                )}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}
