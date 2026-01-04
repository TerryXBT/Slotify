import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function BookingReschedulePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black font-sans pb-24">
            <p className="p-8 text-center">Reschedule form placeholder for booking {id}</p>
            <Link href={`/app/bookings/${id}`} className="block text-blue-600 text-center">
                Back to Booking
            </Link>
        </div>
    )
}
