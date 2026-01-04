'use client'

import { useState, useEffect, useRef } from 'react'
import { format, addDays, startOfWeek, isSameDay, isToday, getHours, getMinutes, differenceInMinutes, parseISO, addWeeks, subWeeks } from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, User } from 'lucide-react'
import { getCalendarEvents } from './actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import clsx from 'clsx'

export default function CalendarView({
    initialDate,
    avatarUrl,
    displayName
}: {
    initialDate: Date
    avatarUrl?: string | null
    displayName?: string | null
}) {
    const router = useRouter()
    const [date, setDate] = useState(initialDate)
    const [events, setEvents] = useState<{ bookings: any[], busyBlocks: any[] }>({ bookings: [], busyBlocks: [] })
    const [loading, setLoading] = useState(true)
    const [currentTimePosition, setCurrentTimePosition] = useState(0)
    const timelineRef = useRef<HTMLDivElement>(null)

    // Generate Week Days
    const startOfCurrentWeek = startOfWeek(date, { weekStartsOn: 1 }) // Mon
    const days = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i))

    // Navigation functions
    const nextWeek = () => setDate(d => addWeeks(d, 1))
    const prevWeek = () => setDate(d => subWeeks(d, 1))
    const goToToday = () => setDate(new Date())

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true)
            const res = await getCalendarEvents(date.toISOString())
            console.log('Calendar fetch result:', res)
            if (res && !res.error) {
                setEvents({ bookings: res.bookings, busyBlocks: res.busyBlocks })
            }
            setLoading(false)
        }
        fetchEvents()
    }, [date])

    // Update Current Time Line
    useEffect(() => {
        const updateLine = () => {
            const now = new Date()
            if (isSameDay(now, date)) {
                const minutes = now.getHours() * 60 + now.getMinutes()
                setCurrentTimePosition(minutes)
            } else {
                setCurrentTimePosition(-1)
            }
        }
        updateLine()
        const interval = setInterval(updateLine, 60000)
        return () => clearInterval(interval)
    }, [date])

    // Auto-scroll to current time on mount
    useEffect(() => {
        if (timelineRef.current && currentTimePosition >= 0) {
            const scrollPosition = (currentTimePosition / 60) * HOUR_HEIGHT - 200 // Offset to center
            timelineRef.current.scrollTop = Math.max(0, scrollPosition)
        }
    }, [currentTimePosition])


    const START_HOUR = 0
    const END_HOUR = 23
    const HOUR_HEIGHT = 60 // px (reduced for 24-hour view)

    const getTopPosition = (dateStr: string) => {
        const d = new Date(dateStr)
        const minutes = d.getHours() * 60 + d.getMinutes()
        const offset = (minutes - START_HOUR * 60) * (HOUR_HEIGHT / 60)
        return Math.max(0, offset)
    }

    const getHeight = (startStr: string, endStr: string) => {
        const start = new Date(startStr)
        const end = new Date(endStr)
        const diff = differenceInMinutes(end, start)
        return diff * (HOUR_HEIGHT / 60)
    }

    return (
        <div className="flex flex-col h-screen pb-20">
            {/* Header */}
            <div className="bg-[#1C1C1E] sticky top-0 z-20 shadow-sm border-b border-gray-800">
                <div className="flex items-center justify-between p-4 pb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={displayName || 'User'} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-6 h-6 text-gray-500" />
                            )}
                        </div>
                        <h1 className="text-lg font-bold leading-tight">{format(date, 'MMMM yyyy')}</h1>
                    </div>
                    <div className="flex items-center gap-1 bg-[#1C1C1E] rounded-lg p-1">
                        <button onClick={prevWeek} className="p-1 hover:bg-gray-200 rounded-md">
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <button onClick={goToToday} className="px-3 py-1 text-xs font-bold text-gray-700">
                            Today
                        </button>
                        <button onClick={nextWeek} className="p-1 hover:bg-gray-200 rounded-md">
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Days Strip */}
                <div className="flex justify-between px-2 pb-2 pt-2">
                    {days.map((d) => {
                        const isSelected = isSameDay(d, date)
                        const isCurrentDay = isToday(d)
                        return (
                            <button
                                key={d.toISOString()}
                                onClick={() => setDate(d)}
                                className={clsx(
                                    "flex flex-col items-center justify-center flex-1 py-3 rounded-2xl transition-all relative",
                                    isSelected ? "bg-blue-600 text-white shadow-md scale-100" : "text-gray-500 hover:bg-black"
                                )}
                            >
                                <span className={clsx("text-[10px] font-bold uppercase tracking-wide mb-1 opacity-80", isSelected ? "text-blue-100" : "text-gray-400")}>{format(d, 'EEE')}</span>
                                <span className={clsx("text-lg font-bold leading-none", isSelected ? "text-white" : isCurrentDay ? "text-blue-600" : "text-gray-300")}>{format(d, 'd')}</span>
                                {
                                    isCurrentDay && !isSelected && (
                                        <div className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full" />
                                    )
                                }
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Timeline */}
            <div ref={timelineRef} className="flex-1 overflow-y-auto relative bg-black p-4 text-white">

                {/* Grid */}
                <div className="relative" style={{ height: (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT }}>
                    {Array.from({ length: END_HOUR - START_HOUR + 1 }).map((_, i) => {
                        const hour = START_HOUR + i
                        return (
                            <div key={hour} className="flex w-full absolute" style={{ top: i * HOUR_HEIGHT }}>
                                <div className="w-12 text-xs font-medium text-gray-400 -mt-2 text-right pr-3 sticky left-0">
                                    {format(new Date().setHours(hour, 0), 'HH:mm')}
                                </div>
                                <div className="flex-1 border-t border-gray-200 border-dashed" />
                            </div>
                        )
                    })}

                    {/* Current Time Line */}
                    {currentTimePosition >= START_HOUR * 60 && currentTimePosition <= END_HOUR * 60 && (
                        <div
                            className="absolute left-12 right-0 z-20 flex items-center pointer-events-none"
                            style={{ top: (currentTimePosition - START_HOUR * 60) * (HOUR_HEIGHT / 60) }}
                        >
                            <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 flex-shrink-0 shadow-lg shadow-red-500/50" />
                            <div className="h-0.5 w-full bg-red-500 shadow-sm" />
                        </div>
                    )}

                    {/* Events */}
                    {!loading && (
                        <>
                            {events.bookings.map(booking => (
                                <Link
                                    href={`/app/bookings/${booking.id}`}
                                    key={booking.id}
                                    className="absolute left-14 right-2 bg-[#1C1C1E] rounded-lg shadow-sm border-l-[3px] p-2 overflow-hidden active:scale-[0.99] transition-all hover:z-10 hover:shadow-md"
                                    style={{
                                        top: getTopPosition(booking.start_at),
                                        height: getHeight(booking.start_at, booking.end_at),
                                        borderLeftColor: booking.services?.color || '#3b82f6'
                                    }}
                                >
                                    <div className="flex gap-2 h-full">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <div className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#1C1C1E] text-gray-500 whitespace-nowrap">
                                                    {format(new Date(booking.start_at), 'HH:mm')} - {format(new Date(booking.end_at), 'HH:mm')}
                                                </div>
                                            </div>
                                            <div className="font-bold text-sm text-white leading-tight truncate">
                                                {booking.services?.name}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate mt-0.5 flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {booking.client_name}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}

                            {/* Busy Blocks */}
                            {events.busyBlocks.map(block => (
                                <div
                                    key={block.id}
                                    className="absolute left-14 right-2 bg-black/80 rounded-lg p-2 flex items-center justify-center pointer-events-none border border-gray-200/50"
                                    style={{
                                        top: getTopPosition(block.start_at),
                                        height: getHeight(block.start_at, block.end_at),
                                        backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(0,0,0,0.02) 5px, rgba(0,0,0,0.02) 10px)'
                                    }}
                                >
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                        {block.title || 'Busy'}
                                    </span>
                                </div>
                            ))}
                        </>
                    )
                    }
                </div >
            </div >

            {/* FAB */}
            < Link href="/app/busy/new" className="fixed bottom-24 right-5 w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 text-white active:scale-90 transition-transform z-50 hover:bg-blue-500" >
                <Plus className="w-8 h-8" />
            </Link >

        </div >
    )
}
