import { createClient } from '@/utils/supabase/server'
import { format, differenceInMinutes, isAfter, isBefore, addMinutes } from 'date-fns'
import Link from 'next/link'
import { Plus, Settings as SettingsIcon, Clock, MapPin, Video, CheckCircle, MessageSquare, Phone, ChevronRight, AlertCircle, Calendar as CalendarIcon, StickyNote } from 'lucide-react'
import ServiceCard from '@/components/ServiceCard'

export default async function TodayPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single()
    if (!profile) return <div>Profile not found.</div>

    const todayStr = format(new Date(), 'yyyy-MM-dd')
    const now = new Date()

    // Fetch today's bookings
    const { data: bookings } = await supabase
        .from('bookings')
        .select('*, services(name, duration_minutes, location_type, default_location)')
        .eq('provider_id', profile.id)
        .gte('start_at', `${todayStr}T00:00:00`)
        .lt('start_at', `${todayStr}T23:59:59`)
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
    // actually, let's say start time is after Now minlus some buffer, or just the first one found that hasn't finished.
    // We'll filter for bookings where end_at > now
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
        <div className="min-h-screen bg-black font-sans pb-24 text-gray-100 overflow-y-auto">

            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md px-5 pt-12 pb-2">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                            {format(now, 'MMM d • EEEE')}
                        </p>
                        <h1 className="text-2xl font-bold tracking-tight mt-1 text-white">
                            Good Morning, {profile.full_name?.split(' ')[0] || 'Pro'}
                        </h1>
                    </div>
                    <div className="relative">
                        {/* Avatar */}
                        {profile.avatar_url ? (
                            <img
                                src={profile.avatar_url}
                                alt="Profile"
                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-sm">
                                {profile.full_name?.[0] || profile.username[0].toUpperCase()}
                            </div>
                        )}
                        {/* Notification Dot */}
                        {needsAction.length > 0 && (
                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                        )}
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-xl font-semibold text-gray-200">
                        {totalBookingsCount} bookings today
                    </p>
                    <p className="text-base font-medium text-gray-500 mt-1">
                        You have {freeHours} hours of free time.
                    </p>
                </div>

                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    <Link href="/app/busy/new" className="flex items-center gap-2 px-5 py-3 bg-[#1C1C1E] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-blue-600 font-medium whitespace-nowrap active:scale-95 transition-transform border border-transparent">
                        <Plus className="w-5 h-5" />
                        Busy Block
                    </Link>
                    <Link href="/app/reschedule" className="flex items-center gap-2 px-5 py-3 bg-[#1C1C1E] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-gray-300 font-medium whitespace-nowrap active:scale-95 transition-transform border border-transparent">
                        <Clock className="w-5 h-5" />
                        Reschedule
                    </Link>
                    <Link href="/app/settings" className="flex items-center gap-2 px-5 py-3 bg-[#1C1C1E] rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-gray-300 font-medium whitespace-nowrap active:scale-95 transition-transform border border-transparent">
                        <SettingsIcon className="w-5 h-5" />
                        Settings
                    </Link>
                </div >
            </header >

            <main className="px-5 space-y-8 mt-2">

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
                        <h2 className="text-lg font-bold text-white">Up Next</h2>
                    </div>

                    {nextBooking ? (
                        <div className="bg-[#1C1C1E] rounded-3xl p-5 shadow-lg shadow-gray-200/50 border border-gray-800 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-2 bg-blue-500"></div>
                            <div className="flex justify-between items-start pl-3 mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-white leading-tight">{nextBooking.client_name}</h3>
                                    <p className="text-blue-500 font-semibold text-base mt-1">{nextBooking.services?.name}</p>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider">
                                    <CheckCircle className="w-3 h-3" />
                                    Confirmed
                                </div>
                            </div>

                            <div className="pl-3 grid gap-3 mb-5">
                                <div className="flex items-center gap-3 text-gray-200">
                                    <div className="w-8 h-8 rounded-lg bg-[#1C1C1E] flex items-center justify-center text-gray-500">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-lg font-bold block leading-none">{format(new Date(nextBooking.start_at), 'h:mm a')}</span>
                                        <span className="text-sm text-gray-500 font-medium">Until {format(new Date(nextBooking.end_at), 'h:mm a')} ({nextBooking.services?.duration_minutes}m)</span>
                                    </div>
                                </div>
                                {/* Location Dummy */}
                                <div className="flex items-center gap-3 text-gray-200">
                                    <div className="w-8 h-8 rounded-lg bg-[#1C1C1E] flex items-center justify-center text-gray-500">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-base font-semibold block leading-tight">Downtown Studio</span>
                                        <span className="text-sm text-gray-500 font-medium">Room 4B</span>
                                    </div>
                                </div>
                            </div >

                            {
                                nextBooking.notes && (
                                    <div className="pl-3 mb-6">
                                        <div className="bg-black border border-gray-100 rounded-xl p-4 flex gap-3">
                                            <StickyNote className="w-5 h-5 text-gray-400" />
                                            <p className="text-sm text-gray-300 italic font-medium leading-relaxed">
                                                "{nextBooking.notes}"
                                            </p>
                                        </div>
                                    </div>
                                )
                            }

                            <div className="pl-3 flex gap-3">
                                <Link href={`/app/bookings/${nextBooking.id}`} className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-xl font-bold text-base shadow-md shadow-blue-500/20 active:scale-[0.98] transition-all flex justify-center items-center gap-2">
                                    Check In
                                </Link>
                                <button className="w-14 flex items-center justify-center bg-black text-gray-600 border border-gray-700 rounded-xl hover:bg-[#1C1C1E] active:scale-95 transition-all">
                                    <MessageSquare className="w-6 h-6" />
                                </button>
                                <button className="w-14 flex items-center justify-center bg-black text-gray-600 border border-gray-700 rounded-xl hover:bg-[#1C1C1E] active:scale-95 transition-all">
                                    <Phone className="w-6 h-6" />
                                </button>
                            </div>
                        </div >
                    ) : (
                        <div className="text-center py-10 bg-[#1C1C1E] rounded-3xl border border-dashed border-gray-200">
                            <p className="text-gray-500 font-medium">No upcoming bookings.</p>
                        </div >
                    )
                    }
                </section >

                {/* SECTION: Services */}
                < section >
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-white">Services</h2>
                        <Link
                            href="/app/settings?tab=services"
                            className="text-sm font-semibold text-blue-600 hover:underline"
                        >
                            Manage
                        </Link>
                    </div>

                    {
                        services && services.length > 0 ? (
                            <div className="space-y-3">
                                {services.map((service: any) => (
                                    <ServiceCard
                                        key={service.id}
                                        service={service}
                                        username={profile.username}
                                    />
                                ))}

                                {/* Add New Service Button */}
                                <Link
                                    href="/app/settings?tab=services"
                                    className="flex items-center justify-center gap-2 bg-[#1C1C1E] rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all"
                                >
                                    <Plus className="w-5 h-5 text-blue-600 dark:text-blue-500" />
                                    <span className="text-sm font-semibold text-blue-600">Add New Service</span>
                                </Link>
                            </div >
                        ) : (
                            <div className="text-center py-8 bg-gray-900 rounded-2xl border border-dashed border-gray-200">
                                <p className="text-gray-500 font-medium mb-3">No services yet</p>
                                < Link
                                    href="/app/settings?tab=services"
                                    className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:underline"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create your first service
                                </Link >
                            </div >
                        )
                    }
                </section >

                {/* SECTION 3: Rest of Today */}
                {
                    restOfToday.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold text-white mb-4">Rest of Today</h2>
                            <div className="space-y-4">
                                {restOfToday.map((b: any) => (
                                    <div key={b.id} className="bg-[#1C1C1E] rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-transparent flex items-center gap-4">
                                        <div className="flex flex-col items-center justify-center w-16 text-center border-r border-gray-800 pr-4">
                                            <span className="text-base font-bold text-white">
                                                {format(new Date(b.start_at), 'h:mm')}
                                            </span>
                                            <span className="text-xs font-semibold text-gray-500 uppercase">
                                                {format(new Date(b.start_at), 'a')}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-base font-bold text-white truncate">{b.client_name}</h4>
                                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-600 text-xxs font-bold uppercase">
                                                    Confirmed
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 font-medium truncate">{b.services?.name}</p>
                                        </div>
                                        <Link href={`/app/bookings/${b.id}`} className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-gray-400\">\n                                            <ChevronRight className="w-6 h-6" />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </section >
                    )
                }

                <div className="text-center mt-10 mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-200 text-gray-400 mb-3">
                        <CalendarIcon className="w-6 h-6" />
                    </div>
                    <p className="text-gray-500 font-medium text-sm">That's all for today.</p>
                </div>

            </main >
        </div >
    )
}
