import { createClient } from '@/utils/supabase/server'
import { format, addDays } from 'date-fns'
import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { Clock, ChevronRight, Plus } from 'lucide-react'
import ServiceCard from '@/components/ServiceCard'
import UpNextCard from '@/components/UpNextCard'
import ActionGrid from '@/components/ActionGrid'
import type { BookingWithService, Service } from '@/types'

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
    const needsAction = bookings?.filter((b: BookingWithService) => b.status === 'pending_reschedule') || []

    // 2. Up Next: The FIRST 'confirmed' booking that hasn't ended yet
    // Filter to ensure we generally stick to "today" conceptually, but we include "tomorrow" items if they are the VERY NEXT thing?
    // User asked "All activities of the day".
    // We will trust the query order.
    // However, if we grabbed tomorrow 10am, and today is 8pm and no bookings left, UpNext = Tomorrow 10am. This is good.
    const upcomingBookings = bookings?.filter((b: BookingWithService) =>
        b.status === 'confirmed' && new Date(b.end_at) > now
    ) || []

    const nextBooking = upcomingBookings.length > 0 ? upcomingBookings[0] : null
    const restOfToday = upcomingBookings.length > 1 ? upcomingBookings.slice(1) : []

    const totalBookingsCount = bookings?.length || 0

    // Free time calculation (rough approximation)
    // Assume work day 9-5 (8 hours = 480 mins)
    // Sum booking durations
    const totalBookedMinutes = bookings?.reduce((acc: number, b: BookingWithService) => acc + (b.services?.duration_minutes || 0), 0) || 0
    const freeMinutes = 480 - totalBookedMinutes
    const freeHours = Math.max(0, Math.floor(freeMinutes / 60))

    return (
        <div className="min-h-screen bg-[#1a1a1a] font-sans pb-32 text-white selection:bg-blue-500/30">

            {/* Large Header */}
            <header className="pt-14 pb-4 px-6 flex justify-between items-center bg-[#1a1a1a]/80 backdrop-blur-md sticky top-0 z-50 border-b border-white/5">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        Today
                    </h1>
                    <p className="text-sm text-zinc-400 font-medium mt-0.5 uppercase tracking-wide">
                        {format(new Date(), 'MMMM d')}
                    </p>
                </div>
                <Link href="/app/settings" className="relative active:opacity-70 transition-all hover:scale-105">
                    {profile.avatar_url ? (
                        <Image
                            src={profile.avatar_url}
                            alt="Profile"
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-zinc-800 grayscale-[0.2] transition-all"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 font-semibold text-sm transition-all">
                            {profile.full_name?.[0] || profile.username[0].toUpperCase()}
                        </div>
                    )}
                </Link>
            </header>

            <main className="px-6 space-y-10 mt-6">

                {/* SECTION 1: Up Next */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white tracking-tight">Up Next</h2>
                    </div>

                    {nextBooking ? (
                        <UpNextCard booking={nextBooking} />
                    ) : (
                        <div className="relative rounded-3xl py-12 flex flex-col items-center justify-center text-center overflow-hidden">
                            {/* Glassmorphism Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
                            <div className="absolute inset-0 rounded-3xl border border-white/10" />
                            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/[0.08] to-transparent opacity-60" />

                            <div className="relative z-10 w-16 h-16 mb-4 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/10 flex items-center justify-center">
                                <Clock className="w-8 h-8 text-white/50" />
                            </div>
                            <h3 className="relative z-10 text-lg font-semibold text-white mb-1">No upcoming bookings</h3>
                            <p className="relative z-10 text-sm text-white/50 max-w-[200px] leading-relaxed">You're all clear for now.</p>
                        </div>
                    )}
                </section>

                {/* SECTION 2: Rest of Today */}
                {restOfToday.length > 0 && (
                    <section>
                        <h2 className="text-xl font-bold text-white mb-4 tracking-tight">Rest of Today</h2>
                        <div className="relative space-y-px rounded-3xl overflow-hidden">
                            {/* Glassmorphism Background */}
                            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
                            <div className="absolute inset-0 rounded-3xl border border-white/10" />
                            {restOfToday.map((b: BookingWithService, index: number) => (
                                <Link
                                    key={b.id}
                                    href={`/app/bookings/${b.id}`}
                                    className={`relative block p-6 hover:bg-white/5 active:bg-white/10 transition-all ${index !== restOfToday.length - 1 ? 'border-b border-white/5' : ''}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            {/* Time Layout */}
                                            <div className="flex flex-col items-start min-w-[4rem]">
                                                <span className="text-white font-bold text-xl leading-none">
                                                    {format(new Date(b.start_at), 'h:mm')}
                                                </span>
                                                <span className="text-zinc-500 text-xs font-bold uppercase mt-1">
                                                    {format(new Date(b.start_at), 'a')}
                                                </span>
                                            </div>

                                            <div>
                                                <h4 className="text-base font-bold text-white tracking-tight mb-0.5">{b.client_name}</h4>
                                                <p className="text-sm text-zinc-400 font-medium">{b.services?.name}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-zinc-500" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* SECTION 3: Services */}
                <section>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-white tracking-tight">Services</h2>
                        <Link
                            href="/app/services"
                            className="text-sm font-semibold text-blue-500 active:opacity-60 transition-opacity"
                        >
                            See All
                        </Link>
                    </div>

                    <div className="relative">
                        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar snap-x">
                            {services && services.filter((s: Service) => s.is_active).map((service: Service) => (
                                <ServiceCard
                                    key={service.id}
                                    service={service}
                                    username={profile.username}
                                />
                            ))}

                            {/* Add New */}
                            <Link
                                href="/app/services/new"
                                className="w-36 h-36 flex flex-col items-center justify-center gap-3 active:scale-95 transition-all flex-shrink-0 snap-start group"
                            >
                                <div className="w-12 h-12 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/10 flex items-center justify-center transition-colors">
                                    <Plus className="w-6 h-6 text-white/50 group-hover:text-white" />
                                </div>
                                <span className="text-sm font-semibold text-white/50 group-hover:text-white transition-colors">Add New</span>
                            </Link>
                        </div>
                        {/* Fade-out gradient indicator for scroll */}
                        <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-[#1a1a1a] to-transparent pointer-events-none" />
                    </div>
                </section>

                {/* SECTION 4: Quick Actions */}
                <section>
                    <h2 className="text-xl font-bold text-white mb-4 tracking-tight">Quick Actions</h2>
                    <ActionGrid />
                </section>

                <div className="py-2"></div>
                <div className="text-center">
                    <p className="text-[10px] text-zinc-700 font-medium uppercase tracking-widest">Powered by Slotify</p>
                </div>
            </main>
        </div>
    )
}
