import { createClient } from '@/utils/supabase/server'
import { format, differenceInMinutes, isAfter, isBefore, addMinutes, addDays } from 'date-fns'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, Settings as SettingsIcon, Clock, MapPin, Video, CheckCircle, MessageSquare, Phone, ChevronRight, AlertCircle, Calendar as CalendarIcon, StickyNote } from 'lucide-react'
import ServiceCard from '@/components/ServiceCard'
import UpNextCard from '@/components/UpNextCard'
import ActionGrid from '@/components/ActionGrid'

export default async function TodayPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch user profile (should be auto-created by database trigger on signup)
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // If profile doesn't exist, something went wrong with the signup process
    if (!profile || profileError) {
        console.error('Profile not found for user:', user.id, profileError)
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-black p-4">
                <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-xl w-full max-w-md text-center space-y-4">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h1 className="text-2xl font-bold">Profile Not Found</h1>
                    <p className="text-gray-500">
                        Your account exists but your profile is missing. This shouldn't happen.
                    </p>
                    <p className="text-gray-400 text-sm">
                        Please logout and try signing up again, or contact support if the problem persists.
                    </p>
                    <div className="pt-4">
                        <Link
                            href="/logout"
                            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Logout
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const now = new Date()

    // Fetch today's bookings: Widen search to include next day 12pm to account for timezone shifts
    const nextDay = addDays(new Date(), 1)
    const nextDayStr = format(nextDay, 'yyyy-MM-dd')

    // We fetch a wider range to filter clientside/rendering-side if needed, ensuring we don't miss late night events
    const { data: bookings } = await supabase
        .from('bookings')
        .select('*, services(name, duration_minutes, location_type, default_location)')
        .eq('provider_id', profile.id)
        .gte('start_at', `${todayStr}T00:00:00`)
        .lt('start_at', `${nextDayStr}T12:00:00`)
        .order('start_at', { ascending: true })

    // Fetch user's services
    const { data: services } = await supabase
        .from('services')
        .select('*')
        .eq('provider_id', profile.id)
        .order('name', { ascending: true })

    // --- LOGIC: Categorize Bookings ---

    // 1. Needs Action: Status = 'pending_reschedule' (or other future statuses)
    // For P0 Demo: We'll pretend 'pending_reschedule' bookings need action.
    const needsAction = bookings?.filter((b: any) => b.status === 'pending_reschedule') || []

    // 2. Up Next: The FIRST 'confirmed' booking that hasn't ended yet
    // Filter to ensure we generally stick to "today" conceptually, but we include "tomorrow" items if they are the VERY NEXT thing?
    // User asked "All activities of the day".
    // We will trust the query order.
    // However, if we grabbed tomorrow 10am, and today is 8pm and no bookings left, UpNext = Tomorrow 10am. This is good.
    const upcomingBookings = bookings?.filter((b: any) =>
        b.status === 'confirmed' && new Date(b.end_at) > now
    ) || []

    const nextBooking = upcomingBookings.length > 0 ? upcomingBookings[0] : null
    const restOfToday = upcomingBookings.length > 1 ? upcomingBookings.slice(1) : []

    const totalBookingsCount = bookings?.length || 0

    // Free time calculation (rough approximation)
    // Assume work day 9-5 (8 hours = 480 mins)
    // Sum booking durations
    const totalBookedMinutes = bookings?.reduce((acc: number, b: any) => acc + (b.services?.duration_minutes || 0), 0) || 0
    const freeMinutes = 480 - totalBookedMinutes
    const freeHours = Math.max(0, Math.floor(freeMinutes / 60))

    return (
        <div className="min-h-screen bg-black font-sans pb-24 text-white selection:bg-blue-500/30">

            {/* Large Header */}
            <header className="pt-16 pb-6 px-5 flex justify-between items-start">
                <div>
                    <h1 className="text-[34px] font-bold text-white tracking-tight leading-tight">
                        Today
                    </h1>
                    <p className="text-[15px] text-gray-500 font-medium mt-1">
                        {format(new Date(), 'EEEE, MMMM d')}
                    </p>
                </div>
                {/* Moved left slightly with mr-2 */}
                <Link href="/app/settings" className="relative active:scale-95 transition-transform mt-1 mr-2">
                    {profile.avatar_url ? (
                        <img
                            src={profile.avatar_url}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-900 grayscale-[0.3]"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 font-semibold text-[16px]">
                            {profile.full_name?.[0] || profile.username[0].toUpperCase()}
                        </div>
                    )}
                </Link>
            </header>

            <main className="px-5 space-y-6">

                {/* SECTION 1: Up Next */}
                <section>
                    <h2 className="text-[17px] font-bold text-white mb-3 tracking-tight">Next Activity</h2>

                    {nextBooking ? (
                        <UpNextCard booking={nextBooking} />
                    ) : (
                        <div className="bg-[#1C1C1E] rounded-2xl py-12 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 mb-4 rounded-full bg-gray-800 flex items-center justify-center">
                                <Clock className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-semibold text-white mb-2">No upcoming bookings</h3>
                            <p className="text-sm text-gray-400 max-w-sm">You're clear for now. Enjoy your free time!</p>
                        </div>
                    )}
                </section>

                {/* SECTION 2: Rest of Today (Moved Up) */}
                {restOfToday.length > 0 && (
                    <section>
                        <h2 className="text-[19px] font-bold text-white mb-3 tracking-tight">Rest of Today</h2>
                        <div className="space-y-px bg-[#1C1C1E] rounded-2xl overflow-hidden">
                            {restOfToday.map((b: any, index: number) => (
                                <Link
                                    key={b.id}
                                    href={`/app/bookings/${b.id}`}
                                    className={`block p-4 hover:bg-gray-800/50 active:bg-gray-800 transition-colors ${index !== restOfToday.length - 1 ? 'border-b border-gray-800' : ''}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {/* Time Layout */}
                                            <div className="flex flex-col items-center w-12 text-center">
                                                <span className="text-white font-medium text-[16px] leading-tight">
                                                    {format(new Date(b.start_at), 'h:mm')}
                                                </span>
                                                <span className="text-gray-500 text-[11px] font-bold uppercase tracking-wide">
                                                    {format(new Date(b.start_at), 'a')}
                                                </span>
                                            </div>

                                            <div>
                                                <h4 className="text-[16px] font-semibold text-white">{b.client_name}</h4>
                                                <p className="text-[13px] text-gray-500">{b.services?.name}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-600" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* SECTION 3: Services (Horizontal) */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-[19px] font-bold text-white tracking-tight">Services</h2>
                        <Link
                            href="/app/services"
                            className="text-[15px] font-medium text-blue-500 active:opacity-70 transition-opacity"
                        >
                            Manage
                        </Link>
                    </div>

                    <div className="flex gap-4 overflow-x-auto pb-4 -mx-5 px-5 no-scrollbar snap-x">
                        {services && services.filter((s: any) => s.is_active).length > 0 ? (
                            <>
                                {services.filter((s: any) => s.is_active).map((service: any) => (
                                    <ServiceCard
                                        key={service.id}
                                        service={service}
                                        username={profile.username}
                                    />
                                ))}
                                {/* Add New Service Card Placeholder */}
                                <Link
                                    href="/app/services/new"
                                    className="bg-[#1C1C1E] rounded-2xl w-32 h-32 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all text-gray-500 border border-gray-800/50 flex-shrink-0 snap-start"
                                >
                                    <Plus className="w-6 h-6" />
                                    <span className="text-xs font-medium">Add New</span>
                                </Link>
                            </>
                        ) : (
                            <Link
                                href="/app/services/new"
                                className="w-full py-6 bg-[#1C1C1E] rounded-2xl flex flex-col items-center text-gray-500 active:scale-95 transition-all"
                            >
                                <Plus className="w-6 h-6 mb-2" />
                                <span className="text-sm font-medium">Create your first service</span>
                            </Link>
                        )}
                    </div>
                </section>

                {/* SECTION 4: Quick Actions (Moved Down) */}
                <section>
                    <h2 className="text-[19px] font-bold text-white mb-3 tracking-tight">Quick Actions</h2>
                    <ActionGrid />
                </section>

                <div className="py-8"></div>
            </main>
        </div>
    )
}
