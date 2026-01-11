import { createClient } from '@/utils/supabase/server'
import { format } from 'date-fns'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
    ArrowLeft, Calendar, Clock, MapPin,
    MessageSquare, Phone, Mail,
    MoreHorizontal, Video, ExternalLink
} from 'lucide-react'
import { cancelBookingAsPro } from '@/app/actions/cancel'

export default async function BookingDetailPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch Booking with related info
    const { data: booking, error } = await supabase
        .from('bookings')
        .select('*, services(name, duration_minutes, price_cents, location_type, default_location)')
        .eq('id', id)
        .single()

    if (error || !booking) {
        notFound()
    }

    // Verify ownership (RLS should handle this, but being explicit is safe)
    if (booking.provider_id !== user.id) {
        notFound()
    }

    const startDate = new Date(booking.start_at)
    const endDate = new Date(booking.end_at)

    return (
        <div className="min-h-screen bg-black text-white font-sans pb-32">

            {/* Header */}
            <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-3 flex items-center justify-between">
                <Link href="/app/today" className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full active:bg-white/10 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-blue-500" />
                </Link>
                <div className="font-semibold text-[17px]">Booking Details</div>
                <button className="flex items-center justify-center w-10 h-10 -mr-2 rounded-full active:bg-white/10 transition-colors">
                    <MoreHorizontal className="w-5 h-5 text-blue-500" />
                </button>
            </header>

            <main className="px-4 max-w-lg mx-auto space-y-6 pt-6">

                {/* Profile Section */}
                <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-2xl font-bold text-gray-400">
                        {booking.client_name?.[0]}
                    </div>
                    <h2 className="text-[22px] font-bold tracking-tight mb-1">{booking.client_name}</h2>
                    <div className="flex items-center gap-2 text-[15px] text-gray-400">
                        <span>{booking.services?.name}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                        <span className="capitalize text-green-500 font-medium">{booking.status}</span>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-3 gap-3">
                    <a href={`mailto:${booking.client_email}`} className="flex flex-col items-center gap-2 bg-[#1C1C1E] p-4 rounded-[14px] active:bg-zinc-800 transition-colors">
                        <Mail className="w-6 h-6 text-blue-500" />
                        <span className="text-[11px] font-medium text-blue-500">Email</span>
                    </a>
                    <a href={`tel:${booking.client_phone || ''}`} className={`flex flex-col items-center gap-2 bg-[#1C1C1E] p-4 rounded-[14px] active:bg-zinc-800 transition-colors ${!booking.client_phone && 'opacity-50 pointer-events-none'}`}>
                        <Phone className="w-6 h-6 text-blue-500" />
                        <span className="text-[11px] font-medium text-blue-500">Call</span>
                    </a>
                    <button className="flex flex-col items-center gap-2 bg-[#1C1C1E] p-4 rounded-[14px] active:bg-zinc-800 transition-colors">
                        <MessageSquare className="w-6 h-6 text-blue-500" />
                        <span className="text-[11px] font-medium text-blue-500">Message</span>
                    </button>
                </div>

                {/* Info Group */}
                <div className="bg-[#1C1C1E] rounded-[14px] overflow-hidden">
                    {/* Date */}
                    <div className="flex items-center p-4 border-b border-white/5 active:bg-white/5 transition-colors">
                        <div className="w-8 flex justify-center mr-3">
                            <Calendar className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[15px] text-gray-400 mb-0.5">Date</div>
                            <div className="text-[17px] font-normal">{format(startDate, 'EEEE, MMMM d, yyyy')}</div>
                        </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center p-4 border-b border-white/5 active:bg-white/5 transition-colors">
                        <div className="w-8 flex justify-center mr-3">
                            <Clock className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1">
                            <div className="text-[15px] text-gray-400 mb-0.5">Time</div>
                            <div className="text-[17px] font-normal">
                                {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                            </div>
                        </div>
                    </div>

                    {/* Location / Link */}
                    {(booking.meeting_location || booking.services?.default_location) && (
                        <div className="flex items-center p-4 active:bg-white/5 transition-colors">
                            <div className="w-8 flex justify-center mr-3">
                                {booking.services?.location_type === 'online' ? (
                                    <Video className="w-5 h-5 text-gray-400" />
                                ) : (
                                    <MapPin className="w-5 h-5 text-gray-400" />
                                )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="text-[15px] text-gray-400 mb-0.5">
                                    {booking.services?.location_type === 'online' ? 'Meeting Link' : 'Location'}
                                </div>
                                {booking.services?.location_type === 'online' ? (
                                    <a
                                        href={booking.meeting_location || booking.services?.default_location}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[17px] text-blue-500 flex items-center gap-1 truncate"
                                    >
                                        Join Meeting
                                        <ExternalLink className="w-3 h-3 opacity-60" />
                                    </a>
                                ) : (
                                    <div className="text-[17px] truncate">
                                        {booking.meeting_location || booking.services?.default_location}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Notes Group */}
                {booking.notes && (
                    <div className="bg-[#1C1C1E] rounded-[14px] p-4">
                        <div className="text-[15px] text-gray-400 mb-2">Notes</div>
                        <p className="text-[17px] leading-relaxed">{booking.notes}</p>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="space-y-3 pt-4">
                    <Link
                        href={`/app/bookings/${booking.id}/reschedule`}
                        className="flex items-center justify-center w-full bg-[#1C1C1E] text-blue-500 font-semibold text-[17px] py-[14px] rounded-[14px] active:opacity-70 transition-opacity"
                    >
                        Reschedule Booking
                    </Link>

                    <form action={cancelBookingAsPro}>
                        <input type="hidden" name="bookingId" value={booking.id} />
                        <button
                            type="submit"
                            className="flex items-center justify-center w-full bg-[#1C1C1E] text-[#FF453A] font-semibold text-[17px] py-[14px] rounded-[14px] active:opacity-70 transition-opacity"
                        >
                            Cancel Booking
                        </button>
                    </form>
                </div>
            </main>
        </div>
    )
}
