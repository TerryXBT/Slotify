import { createClient } from '@/utils/supabase/server'
import { format, differenceInMinutes, isAfter, isBefore, addMinutes, addDays } from 'date-fns'
import Link from 'next/link'
import { Plus, Settings as SettingsIcon, Clock, MapPin, Video, CheckCircle, MessageSquare, Phone, ChevronRight, AlertCircle, Calendar as CalendarIcon, StickyNote } from 'lucide-react'
import ServiceCard from '@/components/ServiceCard'
import UpNextCard from '@/components/UpNextCard'

export default async function TodayPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single()
    if (!profile) return <div>Profile not found.</div>

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
        <div className="min-h-screen bg-black font-sans pb-24 text-gray-100">

            {/* Header */}
            <header className="sticky top-0 z-30 bg-black/95 backdrop-blur-xl border-b border-gray-800/50 px-4 pt-3 pb-3">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h1 className="text-[22px] font-bold text-white leading-tight">
                            Today's Overview
                        </h1>
                        <p className="text-[14px] text-gray-400 font-medium mt-0.5">
                            {totalBookingsCount} Events • {Math.round(totalBookedMinutes / 60)}h Busy
                        </p>
                    </div>
                    <Link href="/app/settings" className="relative active:scale-95 transition-transform">
                        {profile.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt="Profile"
                                className="w-10 h-10 rounded-full object-cover shadow-lg ring-2 ring-gray-800"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-[16px] shadow-lg ring-2 ring-gray-800">
                                {profile.full_name?.[0] || profile.username[0].toUpperCase()}
                            </div>
                        )}
                        {needsAction.length > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 border-2 border-black rounded-full"></span>
                        )}
                    </Link>
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                    <Link href="/app/busy/new" className="flex items-center gap-2 px-4 py-2.5 bg-[#1C1C1E] rounded-xl text-blue-500 text-[14px] font-semibold whitespace-nowrap active:scale-95 transition-all">
                        <Plus className="w-4 h-4" />
                        Busy Block
                    </Link>
                    <Link href="/app/reschedule" className="flex items-center gap-2 px-4 py-2.5 bg-[#1C1C1E] rounded-xl text-gray-400 text-[14px] font-semibold whitespace-nowrap active:scale-95 transition-all">
                        <Clock className="w-4 h-4" />
                        Reschedule
                    </Link>
                    <Link href="/app/settings" className="flex items-center gap-2 px-4 py-2.5 bg-[#1C1C1E] rounded-xl text-gray-400 text-[14px] font-semibold whitespace-nowrap active:scale-95 transition-all">
                        <SettingsIcon className="w-4 h-4" />
                        Settings
                    </Link>
                </div>
            </header>

            <main className="px-4 space-y-6 mt-4">

                {/* SECTION 1: Needs Action */}
                {needsAction.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                            Needs Action
                            <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">{needsAction.length}</span>
                        </h2>
                        {needsAction.map((b: any) => (
                            <div key={b.id} className="bg-[#1C1C1E] rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-orange-100 relative overflow-hidden group">
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500"></div>
                                <div className="flex justify-between items-start mb-3 pl-2">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg font-bold text-white">{b.client_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-base text-gray-500 font-medium">{b.services?.name} • {b.services?.duration_minutes}m</p>
                                            {b.services?.location_type && (
                                                b.services.location_type === 'online' ? (
                                                    <Video className="w-4 h-4 text-blue-500" />
                                                ) : (
                                                    <MapPin className="w-4 h-4 text-purple-500" />
                                                )
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-wider">
                                        <AlertCircle className="w-3 h-3" />
                                        Reschedule
                                    </div>
                                </div>
                                <div className="pl-2 mt-4 flex gap-3">
                                    <button className="flex-1 bg-orange-50 text-orange-700 py-3 rounded-xl font-semibold text-sm hover:bg-orange-100 transition-colors">
                                        Review Request
                                    </button>
                                    <button className="w-12 h-12 flex items-center justify-center bg-black text-gray-600 rounded-xl hover:bg-[#1C1C1E] transition-colors">
                                        <MessageSquare className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </section>
                )}

                {/* SECTION 2: Up Next */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <h2 className="text-[17px] font-semibold text-white">Up Next</h2>
                    </div>

                    {nextBooking ? (
                        <UpNextCard booking={nextBooking} />
                    ) : (
                        <div className="text-center py-12 bg-[#1C1C1E] rounded-2xl border border-dashed border-gray-800">
                            <p className="text-gray-500 text-[15px]">No upcoming bookings.</p>
                        </div>
                    )}
                </section>

                {/* SECTION 3: Rest of Today */}
                {restOfToday.length > 0 && (
                    <section>
                        <h2 className="text-[17px] font-semibold text-white mb-3">Rest of Today</h2>
                        <div className="space-y-2">
                            {restOfToday.map((b: any) => (
                                <Link
                                    key={b.id}
                                    href={`/app/bookings/${b.id}`}
                                    className="bg-[#1C1C1E] rounded-2xl p-3.5 border border-gray-800/50 flex items-center gap-3 active:bg-gray-800/50 transition-colors"
                                >
                                    <div className="flex flex-col items-center justify-center w-14 text-center border-r border-gray-800 pr-3">
                                        <span className="text-[15px] font-semibold text-white">
                                            {format(new Date(b.start_at), 'h:mm')}
                                        </span>
                                        <span className="text-[11px] font-medium text-gray-500 uppercase">
                                            {format(new Date(b.start_at), 'a')}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-0.5">
                                            <h4 className="text-[15px] font-semibold text-white truncate">{b.client_name}</h4>
                                        </div>
                                        <p className="text-[13px] text-gray-500 truncate">{b.services?.name}</p>
                                    </div>
                                    <div className="w-9 h-9 rounded-full bg-gray-800/50 flex items-center justify-center text-gray-400">
                                        <ChevronRight className="w-[18px] h-[18px]" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {/* SECTION: Services */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-[17px] font-semibold text-white">
                            Services <span className="text-gray-500 font-normal ml-1">({services?.filter((s: any) => s.is_active).length || 0} Active)</span>
                        </h2>
                        <Link
                            href="/app/settings?tab=services"
                            className="text-[15px] font-semibold text-blue-500 active:opacity-70 transition-opacity"
                        >
                            Manage
                        </Link>
                    </div>

                    {
                        services && services.filter((s: any) => s.is_active).length > 0 ? (
                            <div className="space-y-3">
                                {services.filter((s: any) => s.is_active).map((service: any) => (
                                    <ServiceCard
                                        key={service.id}
                                        service={service}
                                        username={profile.username}
                                    />
                                ))}

                                {/* Add New Service Button */}
                                <Link
                                    href="/app/settings?tab=services"
                                    className="flex items-center justify-center gap-2 bg-[#1C1C1E] rounded-2xl p-4 border border-dashed border-gray-700 hover:border-blue-500 active:scale-95 transition-all"
                                >
                                    <Plus className="w-[18px] h-[18px] text-blue-500" />
                                    <span className="text-[15px] font-semibold text-blue-500">Add New Service</span>
                                </Link>
                            </div >
                        ) : (
                            <div className="text-center py-10 bg-[#1C1C1E] rounded-2xl border border-dashed border-gray-800">
                                <p className="text-gray-500 text-[15px] mb-3">No active services.</p>
                                <Link
                                    href="/app/settings?tab=services"
                                    className="inline-flex items-center gap-2 text-blue-500 font-semibold text-[15px] active:opacity-70 transition-opacity"
                                >
                                    <Plus className="w-[18px] h-[18px]" />
                                    Create your first service
                                </Link>
                            </div>
                        )
                    }
                </section >

                <div className="text-center mt-8 mb-6">
                    <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-gray-800/50 text-gray-500 mb-2">
                        <CalendarIcon className="w-5 h-5" />
                    </div>
                    <p className="text-gray-500 text-[13px]">That's all for today.</p>
                </div>

            </main >
        </div >
    )
}
