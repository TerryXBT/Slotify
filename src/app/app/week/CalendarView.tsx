'use client'

import { useState, useEffect } from 'react'
import { format, addDays, startOfWeek, isSameDay, isToday, addWeeks, subWeeks, isAfter, isBefore, endOfDay, startOfDay } from 'date-fns'
import { ChevronLeft, ChevronRight, Settings, Calendar as CalendarIcon, List, Plus, X, Loader2 } from 'lucide-react'
import { getCalendarEvents, createManualBooking } from './actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'

type FilterType = 'upcoming' | 'all' | 'past'

interface CalendarViewProps {
    initialDate: Date
    avatarUrl?: string | null
    displayName?: string | null
    services: any[]
}

export default function CalendarView({ initialDate, avatarUrl, displayName, services = [] }: CalendarViewProps) {
    const router = useRouter()
    const [date, setDate] = useState(initialDate)
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [bookings, setBookings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<FilterType>('upcoming')

    // Manual Booking State
    const [isManualBookingOpen, setIsManualBookingOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Generate Week Days for the strip
    const startOfCurrentWeek = startOfWeek(date, { weekStartsOn: 1 }) // Mon
    const days = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i))

    // Navigation functions
    const nextWeek = () => setDate(d => addWeeks(d, 1))
    const prevWeek = () => setDate(d => subWeeks(d, 1))

    // Fetch events
    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true)
            // Fetching a bit more range to ensure we have data for the week
            const res = await getCalendarEvents(date.toISOString())
            if (res && !res.error) {
                setBookings(res.bookings || [])
            } else {
                console.error('Fetch error:', res?.error)
            }
            setLoading(false)
        }
        fetchEvents()
    }, [date])

    // Filter bookings based on selected date AND filter tab
    const filteredBookings = bookings.filter(booking => {
        const bookingStart = new Date(booking.start_at)
        const now = new Date()

        // 1. Must match the selected date
        if (!isSameDay(bookingStart, selectedDate)) return false

        // 2. Apply Tab Filter
        if (filter === 'upcoming') {
            if (booking.status === 'cancelled') return false
            if (isToday(selectedDate) && isBefore(bookingStart, now)) return false
            return true
        }
        if (filter === 'past') {
            if (booking.status === 'cancelled') return true
            if (isBefore(bookingStart, now)) return true
            return false
        }
        return true
    })

    // Sort bookings
    const sortedBookings = [...filteredBookings].sort((a, b) =>
        new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
    )

    // Helper to check if a day has bookings (for dots)
    const getDayStatus = (d: Date) => {
        const dayBookings = bookings.filter(b => isSameDay(new Date(b.start_at), d))
        if (dayBookings.length === 0) return null
        const activeCount = dayBookings.filter(b => b.status !== 'cancelled').length
        if (activeCount > 0) return 'has-bookings'
        return null
    }

    // Status Badge Component
    const StatusBadge = ({ status }: { status: string }) => {
        switch (status) {
            case 'confirmed':
                return (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="text-emerald-400 text-[10px] font-medium tracking-wide uppercase">Confirmed</span>
                    </div>
                )
            case 'pending_reschedule':
                return (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                        <span className="text-orange-400 text-[10px] font-medium tracking-wide uppercase">Pending</span>
                    </div>
                )
            case 'cancelled':
                return (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/5 opacity-70">
                        <span className="text-red-400 text-[10px] font-medium tracking-wide uppercase">Cancelled</span>
                    </div>
                )
            default:
                return null
        }
    }

    async function handleCloseManualBooking() {
        setIsManualBookingOpen(false)
    }

    async function handleManualBookingSubmit(formData: FormData) {
        setIsSubmitting(true)
        const res = await createManualBooking(formData)
        setIsSubmitting(false)

        if (res?.error) {
            alert(res.error)
            return
        }

        // Refresh data
        const updatedRes = await getCalendarEvents(date.toISOString())
        if (updatedRes && !updatedRes.error) {
            setBookings(updatedRes.bookings || [])
        }
        setIsManualBookingOpen(false)
        router.refresh()
    }

    return (
        <div className="flex flex-col h-screen bg-[#1a1a1a] pb-24 text-white font-sans selection:bg-blue-500/30 relative">
            {/* Header */}
            <div className="pt-14 px-5 pb-6">
                <h1 className="text-[34px] font-bold tracking-tight mb-4">Bookings</h1>

                <div className="flex items-center justify-between mb-6">
                    <span className="text-[15px] font-medium text-white">{format(date, 'MMMM yyyy')}</span>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <button onClick={prevWeek} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft className="w-5 h-5 text-white" /></button>
                            <button onClick={nextWeek} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronRight className="w-5 h-5 text-white" /></button>
                        </div>
                        {!isSameDay(selectedDate, new Date()) && (
                            <button
                                onClick={() => {
                                    const today = new Date()
                                    setDate(today)
                                    setSelectedDate(today)
                                }}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-full text-xs font-semibold text-white transition-colors active:scale-95"
                            >
                                Today
                            </button>
                        )}
                    </div>
                </div>

                {/* Week Strip */}
                <div className="flex justify-between items-center px-2">
                    {days.map((d) => {
                        const isSelected = isSameDay(d, selectedDate)
                        const isCurrentDay = isToday(d)
                        const hasBookings = getDayStatus(d)

                        return (
                            <button
                                key={d.toISOString()}
                                onClick={() => setSelectedDate(d)}
                                className="flex flex-col items-center gap-1.5 w-[3.25rem] relative group"
                            >
                                <span className={clsx(
                                    "text-[11px] font-semibold uppercase tracking-wider transition-colors",
                                    isSelected ? "text-white" : isCurrentDay ? "text-blue-500" : "text-gray-500"
                                )}>
                                    {format(d, 'EEE')}
                                </span>

                                <div className={clsx(
                                    "w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200",
                                    isSelected ? "bg-blue-600 scale-110 shadow-md shadow-blue-500/20" : "group-hover:bg-white/10"
                                )}>
                                    <span className={clsx(
                                        "text-[16px] font-bold leading-none",
                                        isSelected ? "text-white" : isCurrentDay ? "text-blue-500" : "text-gray-300"
                                    )}>
                                        {format(d, 'd')}
                                    </span>
                                </div>

                                {hasBookings && !isSelected && (
                                    <div className={clsx(
                                        "absolute bottom-[-4px] w-1 h-1 rounded-full",
                                        isCurrentDay ? "bg-blue-500" : "bg-white"
                                    )} />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Subheader & Count */}
            <div className="px-6 mb-5 flex items-end gap-3 translate-y-2">
                <h2 className="text-[22px] font-bold text-white leading-none">
                    {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE')}
                </h2>
                <div className="pb-1">
                    <span className="text-[13px] font-medium text-gray-400">
                        {sortedBookings.length} {sortedBookings.length === 1 ? 'Booking' : 'Bookings'}
                    </span>
                </div>
            </div>

            {/* Filters */}
            <div className="px-5 mb-6">
                <div className="relative rounded-xl p-1 flex overflow-hidden">
                    {/* Glassmorphism Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
                    <div className="absolute inset-0 rounded-xl border border-white/10" />
                    <button
                        onClick={() => setFilter('upcoming')}
                        className={clsx(
                            "flex-1 py-1.5 text-[13px] font-semibold rounded-[6px] transition-all z-10",
                            filter === 'upcoming' ? "bg-[#3A3A3C] text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={clsx(
                            "flex-1 py-1.5 text-[13px] font-semibold rounded-[6px] transition-all z-10",
                            filter === 'all' ? "bg-[#3A3A3C] text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilter('past')}
                        className={clsx(
                            "flex-1 py-1.5 text-[13px] font-semibold rounded-[6px] transition-all z-10",
                            filter === 'past' ? "bg-[#3A3A3C] text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
                        )}
                    >
                        Past
                    </button>
                </div>
            </div>

            {/* Booking List */}
            <div className="flex-1 overflow-y-auto px-5 space-y-3 pb-safe">
                {loading ? (
                    <div className="flex flex-col gap-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="relative h-24 rounded-2xl animate-pulse overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
                                <div className="absolute inset-0 rounded-2xl border border-white/10" />
                            </div>
                        ))}
                    </div>
                ) : sortedBookings.length > 0 ? (
                    sortedBookings.map(booking => (
                        <Link
                            href={`/app/bookings/${booking.id}`}
                            key={booking.id}
                            className="relative group block p-5 rounded-2xl active:scale-[0.98] transition-all overflow-hidden"
                        >
                            {/* Glassmorphism Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
                            <div className="absolute inset-0 rounded-2xl border border-white/10" />
                            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/[0.08] to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                            <div className="relative z-10 flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-[17px] font-bold text-white mb-0.5 leading-tight">
                                        {booking.client_name}
                                    </h3>
                                    <p className="text-[14px] text-gray-400 font-medium">
                                        {booking.services?.name || 'Unknown Service'}
                                    </p>
                                </div>
                                <StatusBadge status={booking.status} />
                            </div>

                            <div className="relative z-10 flex items-center gap-3 pt-3 border-t border-white/10">
                                <span className="text-[15px] font-semibold text-gray-300">
                                    {format(new Date(booking.start_at), 'h:mm a')}
                                </span>
                                <span className="text-[13px] text-gray-500">
                                    to {format(new Date(booking.end_at), 'h:mm a')}
                                </span>
                            </div>

                        </Link>
                    ))
                ) : (
                    <div className="relative rounded-3xl py-16 flex flex-col items-center justify-center text-center overflow-hidden">
                        {/* Glassmorphism Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
                        <div className="absolute inset-0 rounded-3xl border border-white/10" />
                        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/[0.08] to-transparent opacity-60" />

                        <div className="relative z-10 w-16 h-16 mb-4 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/10 flex items-center justify-center">
                            <List className="w-8 h-8 text-white/50" />
                        </div>
                        <p className="relative z-10 text-lg font-semibold text-white mb-1">No events found</p>
                        <p className="relative z-10 text-sm text-white/50 mb-6">Check other filters or create a new booking</p>
                        <button
                            onClick={() => setIsManualBookingOpen(true)}
                            className="relative z-10 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold text-white transition-colors active:scale-95 flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Create New Booking
                        </button>
                    </div>
                )}
            </div>

            {/* FAB - Manual Booking */}
            <button
                onClick={() => setIsManualBookingOpen(true)}
                className="absolute bottom-24 right-5 w-14 h-14 bg-blue-600 rounded-full shadow-lg shadow-blue-900/40 flex items-center justify-center active:scale-95 transition-transform z-20"
            >
                <Plus className="w-7 h-7 text-white" />
            </button>

            {/* Manual Booking Modal */}
            {isManualBookingOpen && (
                <ManualBookingModal
                    services={services}
                    onClose={handleCloseManualBooking}
                    onSubmit={handleManualBookingSubmit}
                    isSubmitting={isSubmitting}
                />
            )}
        </div>
    )
}

// Generate 15-minute interval time slots
function generateTimeSlots() {
    const slots: string[] = []
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
            const hour = h.toString().padStart(2, '0')
            const minute = m.toString().padStart(2, '0')
            slots.push(`${hour}:${minute}`)
        }
    }
    return slots
}

// Format time for display (12h with AM/PM)
function formatTimeDisplay(time: string) {
    const [h, m] = time.split(':').map(Number)
    const suffix = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    return `${hour12}:${m.toString().padStart(2, '0')} ${suffix}`
}

// Get current time in Australia/Sydney timezone, rounded to nearest 15 min
function getCurrentAusTime() {
    const now = new Date()
    // Get Sydney time
    const sydneyTime = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }))
    const hours = sydneyTime.getHours()
    const minutes = Math.ceil(sydneyTime.getMinutes() / 15) * 15
    // Handle overflow
    const adjustedHours = minutes === 60 ? (hours + 1) % 24 : hours
    const adjustedMinutes = minutes === 60 ? 0 : minutes
    return `${adjustedHours.toString().padStart(2, '0')}:${adjustedMinutes.toString().padStart(2, '0')}`
}

// Generate date options for next 14 days
function generateDateOptions() {
    const options: { value: string; label: string }[] = []
    const today = new Date()

    for (let i = 0; i < 14; i++) {
        const date = addDays(today, i)
        const value = format(date, 'yyyy-MM-dd')
        let label: string

        if (i === 0) label = 'Today'
        else if (i === 1) label = 'Tomorrow'
        else label = format(date, 'EEE, MMM d')

        options.push({ value, label })
    }
    return options
}

interface ManualBookingModalProps {
    services: any[]
    onClose: () => void
    onSubmit: (formData: FormData) => void
    isSubmitting: boolean
}

function ManualBookingModal({ services, onClose, onSubmit, isSubmitting }: ManualBookingModalProps) {
    const timeSlots = generateTimeSlots()
    const dateOptions = generateDateOptions()
    const [selectedTime, setSelectedTime] = useState(getCurrentAusTime())
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [calendarMonth, setCalendarMonth] = useState(new Date())
    const [selectedServiceId, setSelectedServiceId] = useState('')

    // Generate calendar grid for current month
    const generateCalendarDays = () => {
        const year = calendarMonth.getFullYear()
        const month = calendarMonth.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const startPadding = (firstDay.getDay() + 6) % 7 // Mon = 0
        const days: (Date | null)[] = []

        for (let i = 0; i < startPadding; i++) days.push(null)
        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push(new Date(year, month, d))
        }
        return days
    }

    const calendarDays = generateCalendarDays()
    const today = startOfDay(new Date())

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const formData = new FormData()
        formData.set('clientName', (document.querySelector('input[name="clientName"]') as HTMLInputElement)?.value || '')
        formData.set('clientEmail', (document.querySelector('input[name="clientEmail"]') as HTMLInputElement)?.value || '')
        formData.set('clientPhone', (document.querySelector('input[name="clientPhone"]') as HTMLInputElement)?.value || '')
        formData.set('serviceId', selectedServiceId)
        formData.set('date', format(selectedDate, 'yyyy-MM-dd'))
        formData.set('time', selectedTime)

        await onSubmit(formData)
    }

    const prevMonth = () => setCalendarMonth(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
    const nextMonth = () => setCalendarMonth(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Glassmorphism Background for Modal */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.12] via-white/[0.08] to-white/[0.05] backdrop-blur-3xl" />
                <div className="absolute inset-0 rounded-2xl border border-white/20" />

                {/* Header */}
                <div className="relative z-10 px-4 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 backdrop-blur-md">
                    <h3 className="text-[17px] font-semibold text-white">New Reservation</h3>
                    <button
                        onClick={onClose}
                        type="button"
                        className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-4 h-4 text-white" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="relative z-10 p-4 space-y-4">
                    {/* Client Name */}
                    <div>
                        <label className="text-[13px] text-gray-500 font-medium ml-1 mb-1 block">Client Name *</label>
                        <input
                            name="clientName"
                            type="text"
                            required
                            placeholder="e.g. John Doe"
                            className="w-full bg-[#2C2C2E] border border-transparent focus:border-blue-500 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none transition-all"
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="text-[13px] text-gray-500 font-medium ml-1 mb-1 block">Phone *</label>
                        <input
                            name="clientPhone"
                            type="tel"
                            required
                            placeholder="e.g. +61 400 000 000"
                            className="w-full bg-[#2C2C2E] border border-transparent focus:border-blue-500 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none transition-all"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="text-[13px] text-gray-500 font-medium ml-1 mb-1 block">Email (Optional)</label>
                        <input
                            name="clientEmail"
                            type="email"
                            placeholder="e.g. john@example.com"
                            className="w-full bg-[#2C2C2E] border border-transparent focus:border-blue-500 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none transition-all"
                        />
                    </div>

                    {/* Service */}
                    <div>
                        <label className="text-[13px] text-gray-500 font-medium ml-1 mb-1 block">Service *</label>
                        <select
                            value={selectedServiceId}
                            onChange={(e) => setSelectedServiceId(e.target.value)}
                            required
                            className="w-full bg-[#2C2C2E] border border-transparent focus:border-blue-500 rounded-xl px-4 py-3 text-white outline-none"
                        >
                            <option value="">Select a service...</option>
                            {services.map((s: any) => (
                                <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes} min)</option>
                            ))}
                        </select>
                    </div>

                    {/* Mini Calendar */}
                    <div>
                        <label className="text-[13px] text-gray-500 font-medium ml-1 mb-2 block">Date *</label>
                        <div className="bg-[#2C2C2E] rounded-xl p-3">
                            {/* Month Navigation */}
                            <div className="flex items-center justify-between mb-3">
                                <button type="button" onClick={prevMonth} className="p-1 hover:bg-white/10 rounded-full">
                                    <ChevronLeft className="w-5 h-5 text-gray-400" />
                                </button>
                                <span className="text-[15px] font-semibold text-white">
                                    {format(calendarMonth, 'MMMM yyyy')}
                                </span>
                                <button type="button" onClick={nextMonth} className="p-1 hover:bg-white/10 rounded-full">
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {/* Weekday Headers */}
                            <div className="grid grid-cols-7 gap-1 mb-1">
                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                                    <div key={i} className="text-center text-[11px] font-medium text-gray-500 py-1">
                                        {d}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="grid grid-cols-7 gap-1">
                                {calendarDays.map((day, i) => {
                                    if (!day) return <div key={`empty-${i}`} />

                                    const isSelected = isSameDay(day, selectedDate)
                                    const isPast = isBefore(day, today)
                                    const isTodayDate = isSameDay(day, today)

                                    return (
                                        <button
                                            key={day.toISOString()}
                                            type="button"
                                            disabled={isPast}
                                            onClick={() => setSelectedDate(day)}
                                            className={clsx(
                                                "w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-medium transition-all",
                                                isSelected
                                                    ? "bg-blue-600 text-white"
                                                    : isPast
                                                        ? "text-gray-600 cursor-not-allowed"
                                                        : isTodayDate
                                                            ? "text-blue-500 hover:bg-white/10"
                                                            : "text-gray-300 hover:bg-white/10"
                                            )}
                                        >
                                            {day.getDate()}
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Selected Date Display */}
                            <div className="mt-3 pt-3 border-t border-gray-700 text-center">
                                <span className="text-[14px] text-gray-400">Selected: </span>
                                <span className="text-[14px] text-white font-medium">
                                    {isSameDay(selectedDate, today) ? 'Today' : format(selectedDate, 'EEE, MMM d, yyyy')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Time */}
                    <div>
                        <label className="text-[13px] text-gray-500 font-medium ml-1 mb-1 block">Time *</label>
                        <select
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            required
                            className="w-full bg-[#2C2C2E] border border-transparent focus:border-blue-500 rounded-xl px-4 py-3 text-white outline-none"
                        >
                            {timeSlots.map((slot) => (
                                <option key={slot} value={slot}>{formatTimeDisplay(slot)}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !selectedServiceId}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[16px] font-bold py-3.5 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Create Reservation'
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}
