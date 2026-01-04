import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/BottomNav'

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-black pb-24 text-gray-100 font-sans">
            {/* Main Content */}
            <main>
                {children}
            </main>

            {/* Bottom Nav */}
            <BottomNav />
        </div>
    )
}
