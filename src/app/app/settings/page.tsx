import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SettingsView from './SettingsView'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Fetch Profile and Availability Settings in parallel
    const [{ data: profile }, { data: availabilitySettings }] = await Promise.all([
        supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single(),
        supabase
            .from('availability_settings')
            .select('default_buffer_minutes, default_cancellation_policy')
            .eq('provider_id', user.id)
            .single()
    ])

    // If profile doesn't exist, show error
    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] p-4">
                <div className="relative p-8 rounded-2xl shadow-xl max-w-md text-center overflow-hidden">
                    {/* Glassmorphism Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.12] via-white/[0.08] to-white/[0.05] backdrop-blur-3xl" />
                    <div className="absolute inset-0 rounded-2xl border border-white/20" />

                    <h1 className="relative z-10 text-2xl font-bold text-white mb-4">Profile Not Found</h1>
                    <p className="relative z-10 text-gray-400 mb-6">
                        Your account is missing profile data. Please sign out and create a new account.
                    </p>
                    <a
                        href="/login"
                        className="relative z-10 inline-block bg-blue-600 text-white py-3 px-6 rounded-xl font-bold hover:opacity-90 transition-opacity"
                    >
                        Go to Login
                    </a>
                </div>
            </div>
        )
    }

    return <SettingsView profile={profile} availabilitySettings={availabilitySettings} />
}
