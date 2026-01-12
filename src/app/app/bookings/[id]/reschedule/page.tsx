import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import RescheduleFormClient from './RescheduleFormClient'

export default async function BookingReschedulePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch booking details
    const { data: booking, error } = await supabase
        .from('bookings')
        .select('*, services(id, name, duration_minutes)')
        .eq('id', id)
        .single()

    if (error || !booking) {
        notFound()
    }

    // Verify ownership
    if (booking.provider_id !== user.id) {
        notFound()
    }

    // Extract service data
    const servicesData = booking.services as any
    const service = Array.isArray(servicesData) ? servicesData[0] : servicesData

    if (!service) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-[#1a1a1a] text-white font-sans pb-32">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-[#1a1a1a]/80 backdrop-blur-xl border-b border-white/5 px-4 pt-12 pb-3 flex items-center justify-between">
                <Link
                    href={`/app/bookings/${id}`}
                    className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full active:bg-white/10 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 text-blue-500" />
                </Link>
                <div className="font-semibold text-[17px]">Reschedule Booking</div>
                <div className="w-10" /> {/* Spacer for centering */}
            </header>

            <main className="px-4 max-w-lg mx-auto pt-6">
                {/* Booking Info */}
                <div className="bg-[#1C1C1E] rounded-[14px] p-4 mb-6">
                    <h3 className="text-[15px] text-gray-400 mb-2">Current Booking</h3>
                    <p className="text-[17px] font-semibold mb-1">{booking.client_name}</p>
                    <p className="text-[15px] text-gray-400">{service.name}</p>
                </div>

                {/* Reschedule Form */}
                <RescheduleFormClient
                    bookingId={id}
                    providerId={user.id}
                    serviceId={service.id}
                    durationMinutes={service.duration_minutes}
                />
            </main>
        </div>
    )
}
