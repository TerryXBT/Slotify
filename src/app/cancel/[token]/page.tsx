import { createClient } from '@/utils/supabase/server'
import CancelConfirmation from './CancelConfirmation'

// Type for the join query result
interface BookingWithService {
    client_name: string
    start_at: string
    services: { name: string } | null
}

interface ActionTokenWithBooking {
    token: string
    type: string
    booking_id: string
    expires_at: string
    bookings: BookingWithService | null
}

export default async function CancellationPage({ params }: { params: { token: string } }) {
    const { token } = await params
    const supabase = await createClient()

    // Verify token exists and is valid to show details before confirming
    const { data: actionToken } = await supabase
        .from('action_tokens')
        .select('*, bookings(client_name, start_at, services(name))')
        .eq('token', token)
        .eq('type', 'cancel')
        .single() as { data: ActionTokenWithBooking | null }

    if (!actionToken || new Date(actionToken.expires_at) < new Date()) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
                <div className="text-center">
                    <h1 className="text-xl font-bold mb-2">Link Expired</h1>
                    <p>This cancellation link is invalid or expired.</p>
                </div>
            </div>
        )
    }

    const booking = actionToken.bookings

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-red-50 p-6 text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">Cancel Appointment?</h1>
                    <p className="text-gray-600">
                        Hi {booking?.client_name ?? 'there'}, are you sure you want to cancel your appointment?
                    </p>
                </div>

                <div className="p-6">
                    <div className="mb-8 text-center bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">Appointment</div>
                        <div className="text-lg font-semibold text-gray-900">{booking?.services?.name ?? 'Unknown Service'}</div>
                        <div className="text-gray-500">
                            {booking?.start_at ? new Date(booking.start_at).toLocaleString() : 'Unknown time'}
                        </div>
                    </div>

                    <CancelConfirmation token={token} />
                </div>
            </div>
        </div>
    )
}
