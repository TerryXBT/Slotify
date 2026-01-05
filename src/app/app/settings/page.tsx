import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SettingsView from './SettingsView'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // If profile doesn't exist, show error
    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black p-4">
                <div className="bg-[#1C1C1E] p-8 rounded-2xl shadow-xl max-w-md text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Profile Not Found</h1>
                    <p className="text-gray-400 mb-6">
                        Your account is missing profile data. Please sign out and create a new account.
                    </p>
                    <a
                        href="/login"
                        className="inline-block bg-blue-600 text-white py-3 px-6 rounded-xl font-bold hover:opacity-90 transition-opacity"
                    >
                        Go to Login
                    </a>
                </div>
            </div>
        )
    }

    return <SettingsView profile={profile} />
}
