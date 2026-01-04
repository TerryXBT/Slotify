'use client'

import { format } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Clock, MapPin, StickyNote, Phone, CheckCircle } from 'lucide-react'

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

    const handlePhoneClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        // Default anchor behavior will handle the tel: link
    }

    const handleViewBookingClick = (e: React.MouseEvent) => {
        e.stopPropagation()
        router.push(`/app/bookings/${booking.id}`)
    }

    return (
        <div
            onClick={handleCardClick}
            className="bg-[#1C1C1E] rounded-2xl p-4 border border-gray-800/50 relative overflow-hidden cursor-pointer active:bg-gray-800/50 transition-colors group"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                    <h3 className="text-[20px] font-bold text-white leading-tight">{booking.client_name}</h3>
                    <p className="text-blue-500 font-medium text-[15px] mt-0.5">{booking.services?.name}</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-900/30 text-green-400 text-[11px] font-bold uppercase tracking-wide">
                    <CheckCircle className="w-3 h-3" />
                    Confirmed
                </div>
            </div>

            <div className="grid gap-3 mb-4">
                <div className="flex items-center gap-3 text-gray-200">
                    <div className="w-9 h-9 rounded-xl bg-gray-800/50 flex items-center justify-center">
                        <Clock className="w-[18px] h-[18px] text-gray-400" />
                    </div>
                    <div>
                        <span className="text-[17px] font-semibold block leading-tight text-white">
                            {format(new Date(booking.start_at), 'h:mm a')}
                        </span>
                        <span className="text-[13px] text-gray-500">
                            Until {format(new Date(booking.end_at), 'h:mm a')} · {booking.services?.duration_minutes}m
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3 text-gray-200">
                    <div className="w-9 h-9 rounded-xl bg-gray-800/50 flex items-center justify-center">
                        <MapPin className="w-[18px] h-[18px] text-gray-400" />
                    </div>
                    <div>
                        <span className="text-[15px] font-medium block leading-tight text-white">Downtown Studio</span>
                        <span className="text-[13px] text-gray-500">Room 4B</span>
                    </div>
                </div>
            </div>

            {booking.notes && (
                <div className="mb-4">
                    <div className="bg-gray-800/30 rounded-xl p-3 flex gap-2.5">
                        <StickyNote className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-[13px] text-gray-300 leading-relaxed">
                            "{booking.notes}"
                        </p>
                    </div>
                </div>
            )}

            <div className="flex gap-2">
                <button
                    onClick={handleViewBookingClick}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white py-3 rounded-xl font-semibold text-[15px] active:scale-[0.98] transition-all flex justify-center items-center gap-2"
                >
                    View booking
                </button>

                {booking.client_phone ? (
                    <a
                        href={`tel:${booking.client_phone}`}
                        onClick={handlePhoneClick}
                        className="w-11 h-11 flex items-center justify-center bg-gray-800/50 text-gray-400 rounded-xl hover:bg-gray-700/50 active:scale-95 transition-all z-10"
                    >
                        <Phone className="w-[18px] h-[18px]" />
                    </a>
                ) : (
                    <button disabled className="w-11 h-11 flex items-center justify-center bg-gray-800/20 text-gray-600 rounded-xl cursor-not-allowed">
                        <Phone className="w-[18px] h-[18px]" />
                    </button>
                )}
            </div>
        </div>
    )
}
