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
            className="relative overflow-hidden rounded-3xl cursor-pointer group active:scale-[0.98] transition-all duration-300"
        >
            {/* Glassmorphism Background with Subtle Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />

            {/* Border Gradient Effect */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 via-white/5 to-transparent opacity-50"
                 style={{
                     padding: '1px',
                     WebkitMaskImage: 'linear-gradient(#000, #000), linear-gradient(#000, #000)',
                     WebkitMaskClip: 'padding-box, border-box',
                     WebkitMaskComposite: 'xor'
                 }}
            />

            {/* Ambient Light Effect */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/[0.08] to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

            {/* Content Container */}
            <div className="relative z-10 flex items-center justify-between p-6">
                <div className="flex items-center gap-6">
                    {/* Time Display */}
                    <div className="flex flex-col items-center min-w-[4rem]">
                        <span className="text-4xl font-bold tracking-tighter leading-none text-white filter drop-shadow-lg">
                            {format(new Date(booking.start_at), 'h:mm')}
                        </span>
                        <span className="text-xs font-bold text-white/60 uppercase tracking-widest mt-0.5">
                            {format(new Date(booking.start_at), 'a')}
                        </span>
                    </div>

                    <div className="h-14 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>

                    <div>
                        <h3 className="text-xl font-bold leading-tight tracking-tight text-white mb-1">
                            {booking.client_name}
                        </h3>
                        {booking.services && (
                            <div className="flex items-center gap-2 text-sm font-medium text-white/70">
                                <span>{booking.services.name}</span>
                                <span className="w-1 h-1 rounded-full bg-white/30"></span>
                                <span>{booking.services.duration_minutes} min</span>
                            </div>
                        )}
                        {/* Notes hint indicator */}
                        {booking.notes && (
                            <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-white/50 bg-white/5 rounded-full px-2 py-1 w-fit">
                                <StickyNote className="w-3 h-3" />
                                <span>Has notes</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white/10 rounded-full p-2.5 backdrop-blur-sm group-hover:bg-white/15 transition-all border border-white/10">
                    <ChevronRight className="w-5 h-5 text-white/80" />
                </div>
            </div>

            {/* Subtle Shadow */}
            <div className="absolute inset-0 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-3xl pointer-events-none" />
        </div>
    )
}
