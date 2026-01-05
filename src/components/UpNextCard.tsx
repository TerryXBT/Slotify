'use client'

import { format } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Clock, MapPin, StickyNote, Phone, CheckCircle, ChevronRight } from 'lucide-react'

// Define a subset of the booking type needed for UI
interface UpNextCardProps {
    booking: {
        id: string
        client_name: string
        client_phone?: string | null
        start_at: string
        end_at: string
        notes?: string | null
        services?: {
            name: string
            duration_minutes: number
        } | null
    }
}

export default function UpNextCard({ booking }: UpNextCardProps) {
    const router = useRouter()

    const handleCardClick = () => {
        router.push(`/app/bookings/${booking.id}`)
    }

    return (
        <div
            onClick={handleCardClick}
            className="bg-[#1C1C1E] rounded-2xl p-5 active:scale-[0.99] transition-transform cursor-pointer group"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <div className="flex flex-col items-center min-w-[3.5rem]">
                        <span className="text-3xl font-bold text-white leading-none tracking-tight">
                            {format(new Date(booking.start_at), 'h:mm')}
                        </span>
                        <span className="text-xs font-bold text-gray-500 uppercase mt-1">
                            {format(new Date(booking.start_at), 'a')}
                        </span>
                    </div>

                    <div className="h-10 w-px bg-gray-800"></div>

                    <div>
                        <h3 className="text-[17px] font-bold text-white leading-snug">
                            {booking.client_name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-[14px] text-gray-400 mt-0.5">
                            <span className="truncate max-w-[150px]">{booking.services?.name}</span>
                            {booking.services?.duration_minutes && (
                                <>
                                    <span>·</span>
                                    <span>{booking.services.duration_minutes}m</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors" />
                </div>
            </div>

            {/* Optional Footer: Location if needed, but keep minimal for now per design */}
        </div>
    )
}
