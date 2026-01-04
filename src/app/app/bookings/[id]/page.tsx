import { createClient } from '@/utils/supabase/server'
import { format } from 'date-fns'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
    ArrowLeft, Calendar, Clock, MapPin,
    MessageSquare, Phone, Mail, User,
    MoreHorizontal, Ban, RefreshCw, Video, ExternalLink
} from 'lucide-react'
import { cancelBookingAsPro } from '@/app/actions/cancel'
import StatusBadge from '@/components/StatusBadge'

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
        <div className="min-h-screen bg-gray-50 dark:bg-black font-sans pb-24 text-gray-900 dark:text-gray-100">

            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md px-5 pt-12 pb-4 flex items-center justify-between">
                <Link href="/app/today" className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-gray-200 transition-colors">
                    <ArrowLeft className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                </Link>
                <h1 className="text-lg font-bold">Booking Details</h1>
                <button className="w-10 h-10 flex items-center justify-center -mr-2 rounded-full hover:bg-gray-200 transition-colors">
                    <MoreHorizontal className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                </button>
            </header>

            <main className="px-5 space-y-6">

                {/* Status Card */}
                <div className="flex flex-col items-center py-6">
                    <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                        <User className="w-10 h-10 text-gray-400" />
                    </div>
                    <h2 className="text-2xl font-bold">{booking.client_name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-gray-500 font-medium">{booking.services?.name}</p>
                        <StatusBadge status={booking.status} />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-4">
                    <a href={`mailto:${booking.client_email}`} className="flex flex-col items-center justify-center gap-2 bg-[#1C1C1E] p-3 rounded-xl shadow-sm border border-gray-800 active:scale-95 transition-transform">
                        <Mail className="w-6 h-6 text-blue-500" />
                        <span className="text-xs font-medium">Email</span>
                    </a>
                    <a href={`tel:${booking.client_phone || ''}`} className={`flex flex-col items-center justify-center gap-2 bg-[#1C1C1E] p-3 rounded-xl shadow-sm border border-gray-800 active:scale-95 transition-transform ${!booking.client_phone && 'opacity-50 cursor-not-allowed'}`}>
                        <Phone className="w-6 h-6 text-blue-500" />
                        <span className="text-xs font-medium">Call</span>
                    </a>
                    <button className="flex flex-col items-center justify-center gap-2 bg-[#1C1C1E] p-3 rounded-xl shadow-sm border border-gray-800 active:scale-95 transition-transform">
                        <MessageSquare className="w-6 h-6 text-blue-500" />
                        <span className="text-xs font-medium">Message</span>
                    </button>
                </div>

                {/* Details List */}
                <div className="bg-[#1C1C1E] rounded-2xl shadow-sm border border-gray-800 overflow-hidden">
                    <div className="p-4 border-b border-gray-800 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                            <div className="font-semibold">{format(startDate, 'EEEE, MMMM d, yyyy')}</div>
                        </div>
                    </div>
                    <div className="p-4 border-b border-gray-800 flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Time</label>
                            <div className="font-semibold">
                                {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                                <span className="text-gray-500 font-normal ml-1">({booking.services?.duration_minutes} min)</span>
                            </div>
                        </div>
                    </div>
                    {/* Location / Meeting Link */}
                    {(booking.meeting_location || booking.services?.default_location) && (
                        <div className="p-4 flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${booking.services?.location_type === 'online'
                                    ? 'bg-blue-50 text-blue-600'
                                    : 'bg-purple-50 text-purple-600'
                                }`}>
                                {booking.services?.location_type === 'online' ? (
                                    <Video className="w-5 h-5" />
                                ) : (
                                    <MapPin className="w-5 h-5" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <label className="text-xs font-bold text-gray-500 uppercase">
                                    {booking.services?.location_type === 'online' ? 'Meeting Link' : 'Location'}
                                </label>
                                {booking.services?.location_type === 'online' ? (
                                    <a
                                        href={booking.meeting_location || booking.services?.default_location}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 truncate"
                                    >
                                        {booking.meeting_location || booking.services?.default_location}
                                        <ExternalLink className="w-4 h-4 flex-shrink-0" />
                                    </a>
                                ) : (
                                    <div className="font-semibold truncate">
                                        {booking.meeting_location || booking.services?.default_location}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div >

                {/* Client Notes */}
                {
                    booking.notes && (
                        <div className="bg-[#1C1C1E] rounded-2xl shadow-sm border border-gray-800 p-5">
                            <h3 className="font-bold mb-2 text-white">Client Notes</h3>
                            <p className="text-gray-600 italic">"{booking.notes}"</p>
                        </div>
                    )
                }

                {/* Management Actions */}
                <div className="pt-4 space-y-3">
                    <Link href={`/app/bookings/${booking.id}/reschedule`} className="w-full flex items-center justify-center gap-2 bg-[#1C1C1E] text-white font-bold py-4 rounded-xl border border-gray-200 shadow-sm active:scale-[0.98] transition-all">
                        <RefreshCw className="w-5 h-5" />
                        Reschedule Booking
                    </Link>

                    <form action={cancelBookingAsPro}>
                        <input type="hidden" name="bookingId" value={booking.id} />
                        <button type="submit" className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold py-4 rounded-xl border border-transparent active:scale-[0.98] transition-all">
                            <Ban className="w-5 h-5" />
                            Cancel Booking
                        </button>
                    </form>
                </div>

            </main >
        </div >
    )
}
