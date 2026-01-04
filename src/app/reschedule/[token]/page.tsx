import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import RescheduleOptions from './RescheduleOptions'

export default async function ClientReschedulePage({ params }: { params: { token: string } }) {
    const { token } = await params
    const supabase = await createClient()

    // 1. Fetch Proposal
    const { data: proposal } = await supabase
        .from('reschedule_proposals')
        .select('*, bookings(client_name, services(name, duration_minutes))')
        .eq('token', token)
        .single()

    if (!proposal || proposal.status !== 'active' || new Date(proposal.expires_at) < new Date()) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
                <div className="text-center">
                    <h1 className="text-xl font-bold mb-2">Link Expired</h1>
                    <p>This reschedule link is no longer valid.</p>
                </div>
            </div>
        )
    }

    // 2. Fetch Options
    const { data: options } = await supabase
        .from('reschedule_options')
        .select('*')
        .eq('proposal_id', proposal.id)
        .order('start_at', { ascending: true })

    if (!options || options.length === 0) return notFound()

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="bg-blue-600 p-6 text-white text-center">
                    <h1 className="text-2xl font-bold mb-1">Reschedule Appointment</h1>
                    <p className="opacity-90">Hi {proposal.bookings?.client_name}, please choose a new time.</p>
                </div>

                <div className="p-6">
                    <div className="mb-6 text-center">
                        <div className="text-sm text-gray-500 uppercase font-bold tracking-wider mb-1">Service</div>
                        <div className="text-lg font-semibold text-gray-900">{proposal.bookings?.services?.name}</div>
                        <div className="text-gray-500">{proposal.bookings?.services?.duration_minutes} Minutes</div>
                    </div>

                    <RescheduleOptions token={token} options={options} />
                </div>
            </div>
        </div>
    )
}
