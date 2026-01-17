"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  format,
  isToday,
  isTomorrow,
  isThisWeek,
  addDays,
  startOfWeek,
  isSameDay,
  addWeeks,
  subWeeks,
  isBefore,
  startOfDay,
} from "date-fns";
import {
  Search,
  X,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Video,
  ChevronRight,
  ChevronLeft,
  CalendarX,
  CalendarCheck,
  History,
  AlertCircle,
  List,
  Plus,
  Loader2,
} from "lucide-react";
import clsx from "clsx";
import type { Service } from "@/types";
import { getCalendarEvents, createManualBooking } from "../week/actions";

interface BookingWithService {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  start_at: string;
  end_at: string;
  status: string;
  notes: string | null;
  services: {
    name: string;
    duration_minutes: number;
    location_type: string | null;
  } | null;
}

// Calendar booking type (simpler)
interface CalendarBooking {
  id: string;
  status: string;
  start_at: string;
  end_at: string;
  client_name: string;
  services: { name: string } | null;
}

interface BookingsViewProps {
  upcomingBookings: BookingWithService[];
  pastBookings: BookingWithService[];
  cancelledBookings: BookingWithService[];
  pendingBookings: BookingWithService[];
  services: Service[];
  initialTab: string;
  initialSearch: string;
  initialView: "list" | "calendar";
}

type TabType = "upcoming" | "past" | "cancelled";
type ViewType = "list" | "calendar";
type FilterType = "upcoming" | "all" | "past";

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "upcoming", label: "Upcoming", icon: CalendarCheck },
  { id: "past", label: "Past", icon: History },
  { id: "cancelled", label: "Cancelled", icon: CalendarX },
];

export default function BookingsView({
  upcomingBookings,
  pastBookings,
  cancelledBookings,
  pendingBookings,
  services,
  initialTab,
  initialSearch,
  initialView,
}: BookingsViewProps) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewType>(initialView);
  const [activeTab, setActiveTab] = useState<TabType>(
    (initialTab as TabType) || "upcoming",
  );
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [showSearch, setShowSearch] = useState(false);

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarBookings, setCalendarBookings] = useState<CalendarBooking[]>(
    [],
  );
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarFilter, setCalendarFilter] = useState<FilterType>("upcoming");
  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Week days for calendar strip
  const startOfCurrentWeek = startOfWeek(calendarDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) =>
    addDays(startOfCurrentWeek, i),
  );

  // Calendar navigation
  const nextWeek = () => setCalendarDate((d) => addWeeks(d, 1));
  const prevWeek = () => setCalendarDate((d) => subWeeks(d, 1));

  // Fetch calendar events when date or view changes
  useEffect(() => {
    if (viewMode === "calendar") {
      const fetchEvents = async () => {
        setCalendarLoading(true);
        const res = await getCalendarEvents(calendarDate.toISOString());
        if (res && !res.error) {
          setCalendarBookings(res.bookings || []);
        }
        setCalendarLoading(false);
      };
      fetchEvents();
    }
  }, [calendarDate, viewMode]);

  // Get bookings for current tab (list view)
  const currentBookings = useMemo(() => {
    let bookings: BookingWithService[] = [];
    switch (activeTab) {
      case "upcoming":
        bookings = upcomingBookings;
        break;
      case "past":
        bookings = pastBookings;
        break;
      case "cancelled":
        bookings = cancelledBookings;
        break;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      bookings = bookings.filter(
        (b) =>
          b.client_name.toLowerCase().includes(query) ||
          b.client_email?.toLowerCase().includes(query) ||
          b.services?.name.toLowerCase().includes(query),
      );
    }

    return bookings;
  }, [
    activeTab,
    upcomingBookings,
    pastBookings,
    cancelledBookings,
    searchQuery,
  ]);

  // Group upcoming bookings by date
  const groupedBookings = useMemo(() => {
    if (activeTab !== "upcoming") return null;

    const groups: { label: string; bookings: BookingWithService[] }[] = [];
    const today: BookingWithService[] = [];
    const tomorrow: BookingWithService[] = [];
    const thisWeek: BookingWithService[] = [];
    const later: BookingWithService[] = [];

    currentBookings.forEach((booking) => {
      const date = new Date(booking.start_at);
      if (isToday(date)) {
        today.push(booking);
      } else if (isTomorrow(date)) {
        tomorrow.push(booking);
      } else if (isThisWeek(date)) {
        thisWeek.push(booking);
      } else {
        later.push(booking);
      }
    });

    if (today.length > 0) groups.push({ label: "Today", bookings: today });
    if (tomorrow.length > 0)
      groups.push({ label: "Tomorrow", bookings: tomorrow });
    if (thisWeek.length > 0)
      groups.push({ label: "This Week", bookings: thisWeek });
    if (later.length > 0) groups.push({ label: "Later", bookings: later });

    return groups;
  }, [activeTab, currentBookings]);

  // Filter calendar bookings
  const filteredCalendarBookings = calendarBookings.filter((booking) => {
    const bookingStart = new Date(booking.start_at);
    const now = new Date();

    if (!isSameDay(bookingStart, selectedDate)) return false;

    if (calendarFilter === "upcoming") {
      if (booking.status === "cancelled") return false;
      if (isToday(selectedDate) && isBefore(bookingStart, now)) return false;
      return true;
    }
    if (calendarFilter === "past") {
      if (booking.status === "cancelled") return true;
      if (isBefore(bookingStart, now)) return true;
      return false;
    }
    return true;
  });

  const sortedCalendarBookings = [...filteredCalendarBookings].sort(
    (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
  );

  // Helper to check if a day has bookings
  const getDayStatus = (d: Date) => {
    const dayBookings = calendarBookings.filter((b) =>
      isSameDay(new Date(b.start_at), d),
    );
    if (dayBookings.length === 0) return null;
    const activeCount = dayBookings.filter(
      (b) => b.status !== "cancelled",
    ).length;
    if (activeCount > 0) return "has-bookings";
    return null;
  };

  const handleViewChange = (view: ViewType) => {
    setViewMode(view);
    router.replace(`/app/bookings?view=${view}`, { scroll: false });
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    router.replace(`/app/bookings?tab=${tab}&view=${viewMode}`, {
      scroll: false,
    });
  };

  async function handleManualBookingSubmit(formData: FormData) {
    setIsSubmitting(true);
    const res = await createManualBooking(formData);
    setIsSubmitting(false);

    if (res?.error) {
      alert(res.error);
      return;
    }

    const updatedRes = await getCalendarEvents(calendarDate.toISOString());
    if (updatedRes && !updatedRes.error) {
      setCalendarBookings(updatedRes.bookings || []);
    }
    setIsManualBookingOpen(false);
    router.refresh();
  }

  const glassCard =
    "relative rounded-2xl overflow-hidden bg-white/[0.08] backdrop-blur-xl border border-white/[0.08]";

  // Format relative date for display
  const formatBookingDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, "h:mm a");
    }
    return format(date, "MMM d, h:mm a");
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-green-400 bg-green-500/10";
      case "completed":
        return "text-blue-400 bg-blue-500/10";
      case "cancelled":
        return "text-red-400 bg-red-500/10";
      case "pending_reschedule":
        return "text-orange-400 bg-orange-500/10";
      default:
        return "text-gray-400 bg-gray-500/10";
    }
  };

  // Status Badge for calendar view
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "confirmed":
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-emerald-400 text-[10px] font-medium tracking-wide uppercase">
              Confirmed
            </span>
          </div>
        );
      case "pending_reschedule":
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-500/15 border border-orange-500/10">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
            <span className="text-orange-400 text-[10px] font-medium tracking-wide uppercase">
              Pending
            </span>
          </div>
        );
      case "cancelled":
        return (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/5 opacity-70">
            <span className="text-red-400 text-[10px] font-medium tracking-wide uppercase">
              Cancelled
            </span>
          </div>
        );
      default:
        return null;
    }
  };

  // Render booking card for list view
  const renderBookingCard = (booking: BookingWithService) => (
    <Link
      key={booking.id}
      href={`/app/bookings/${booking.id}`}
      className={clsx(
        glassCard,
        "block p-4 transition-all active:scale-[0.98] hover:bg-white/[0.12]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white truncate">
              {booking.client_name}
            </h3>
            {activeTab !== "upcoming" && (
              <span
                className={clsx(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                  getStatusColor(booking.status),
                )}
              >
                {booking.status.replace("_", " ")}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-400 mb-2">{booking.services?.name}</p>

          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <CalendarIcon className="w-3.5 h-3.5" />
              {formatBookingDate(booking.start_at)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {booking.services?.duration_minutes} min
            </span>
            {booking.services?.location_type && (
              <span className="flex items-center gap-1">
                {booking.services.location_type === "video" ? (
                  <Video className="w-3.5 h-3.5" />
                ) : (
                  <MapPin className="w-3.5 h-3.5" />
                )}
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-gray-600 flex-shrink-0 mt-1" />
      </div>
    </Link>
  );

  // Render empty state for list view
  const renderEmptyState = () => {
    const emptyMessages = {
      upcoming: {
        title: "No upcoming bookings",
        description: "When clients book appointments, they'll appear here",
        icon: CalendarCheck,
      },
      past: {
        title: "No past bookings",
        description: "Your completed bookings will appear here",
        icon: History,
      },
      cancelled: {
        title: "No cancelled bookings",
        description: "Cancelled bookings will appear here",
        icon: CalendarX,
      },
    };

    const { title, description, icon: Icon } = emptyMessages[activeTab];

    return (
      <div className={clsx(glassCard, "p-8 text-center")}>
        <div className="w-16 h-16 bg-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Icon className="w-8 h-8 text-gray-500" />
        </div>
        <h3 className="font-semibold text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] font-sans pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#1a1a1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="px-5 pt-14 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Bookings
            </h1>
            <div className="flex items-center gap-2">
              {viewMode === "list" && (
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    showSearch
                      ? "bg-blue-500 text-white"
                      : "bg-white/10 text-gray-400",
                  )}
                >
                  {showSearch ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* View Toggle */}
          <div className="mb-4">
            <div className="relative rounded-xl p-1 flex overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
              <div className="absolute inset-0 rounded-xl border border-white/10" />
              <button
                onClick={() => handleViewChange("list")}
                className={clsx(
                  "flex-1 py-2 text-[13px] font-semibold rounded-lg transition-all z-10 flex items-center justify-center gap-2",
                  viewMode === "list"
                    ? "bg-[#3A3A3C] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-300",
                )}
              >
                <List className="w-4 h-4" />
                List
              </button>
              <button
                onClick={() => handleViewChange("calendar")}
                className={clsx(
                  "flex-1 py-2 text-[13px] font-semibold rounded-lg transition-all z-10 flex items-center justify-center gap-2",
                  viewMode === "calendar"
                    ? "bg-[#3A3A3C] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-300",
                )}
              >
                <CalendarIcon className="w-4 h-4" />
                Calendar
              </button>
            </div>
          </div>

          {/* Search Bar (List view only) */}
          {viewMode === "list" && showSearch && (
            <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or service..."
                  className="w-full pl-12 pr-4 py-3 bg-white/[0.08] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Tabs (List view only) */}
          {viewMode === "list" && (
            <div className="flex gap-2">
              {TABS.map(({ id, label, icon: Icon }) => {
                const count =
                  id === "upcoming"
                    ? upcomingBookings.length
                    : id === "past"
                      ? pastBookings.length
                      : cancelledBookings.length;

                return (
                  <button
                    key={id}
                    onClick={() => handleTabChange(id)}
                    className={clsx(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                      activeTab === id
                        ? "bg-blue-500 text-white"
                        : "bg-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.12]",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                    {count > 0 && (
                      <span
                        className={clsx(
                          "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                          activeTab === id ? "bg-white/20" : "bg-white/10",
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Calendar Header (Calendar view only) */}
          {viewMode === "calendar" && (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[15px] font-medium text-white">
                  {format(calendarDate, "MMMM yyyy")}
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={prevWeek}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={nextWeek}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-white" />
                    </button>
                  </div>
                  {!isSameDay(selectedDate, new Date()) && (
                    <button
                      onClick={() => {
                        const today = new Date();
                        setCalendarDate(today);
                        setSelectedDate(today);
                      }}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-full text-xs font-semibold text-white transition-colors active:scale-95"
                    >
                      Today
                    </button>
                  )}
                </div>
              </div>

              {/* Week Strip */}
              <div className="flex justify-between items-center px-2">
                {days.map((d) => {
                  const isSelected = isSameDay(d, selectedDate);
                  const isCurrentDay = isToday(d);
                  const hasBookings = getDayStatus(d);

                  return (
                    <button
                      key={d.toISOString()}
                      onClick={() => setSelectedDate(d)}
                      className="flex flex-col items-center gap-1.5 w-[3.25rem] relative group"
                    >
                      <span
                        className={clsx(
                          "text-[11px] font-semibold uppercase tracking-wider transition-colors",
                          isSelected
                            ? "text-white"
                            : isCurrentDay
                              ? "text-blue-500"
                              : "text-gray-500",
                        )}
                      >
                        {format(d, "EEE")}
                      </span>

                      <div
                        className={clsx(
                          "w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200",
                          isSelected
                            ? "bg-blue-600 scale-110 shadow-md shadow-blue-500/20"
                            : "group-hover:bg-white/10",
                        )}
                      >
                        <span
                          className={clsx(
                            "text-[16px] font-bold leading-none",
                            isSelected
                              ? "text-white"
                              : isCurrentDay
                                ? "text-blue-500"
                                : "text-gray-300",
                          )}
                        >
                          {format(d, "d")}
                        </span>
                      </div>

                      {hasBookings && !isSelected && (
                        <div
                          className={clsx(
                            "absolute bottom-[-4px] w-1 h-1 rounded-full",
                            isCurrentDay ? "bg-blue-500" : "bg-white",
                          )}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </header>

      {/* Pending Actions Banner (List view only) */}
      {viewMode === "list" &&
        pendingBookings.length > 0 &&
        activeTab === "upcoming" && (
          <div className="px-5 pt-4">
            <Link
              href="/app/bookings?tab=upcoming"
              className={clsx(
                glassCard,
                "flex items-center gap-3 p-4 bg-orange-500/10 border-orange-500/20",
              )}
            >
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">
                  {pendingBookings.length} booking
                  {pendingBookings.length > 1 ? "s" : ""} need attention
                </h3>
                <p className="text-sm text-orange-400/80">
                  Pending reschedule requests
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-orange-400" />
            </Link>
          </div>
        )}

      {/* Content */}
      <main className="px-5 py-6">
        {viewMode === "list" ? (
          // List View Content
          <>
            {currentBookings.length === 0 ? (
              renderEmptyState()
            ) : activeTab === "upcoming" && groupedBookings ? (
              <div className="space-y-6">
                {groupedBookings.map((group) => (
                  <div key={group.label}>
                    <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
                      {group.label}
                    </h2>
                    <div className="space-y-3">
                      {group.bookings.map(renderBookingCard)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {currentBookings.map(renderBookingCard)}
              </div>
            )}

            {searchQuery && (
              <div className="text-center text-gray-500 text-sm mt-4">
                {currentBookings.length} result
                {currentBookings.length !== 1 ? "s" : ""} for &quot;
                {searchQuery}&quot;
              </div>
            )}
          </>
        ) : (
          // Calendar View Content
          <>
            {/* Subheader & Count */}
            <div className="mb-5 flex items-end gap-3">
              <h2 className="text-[22px] font-bold text-white leading-none">
                {isToday(selectedDate) ? "Today" : format(selectedDate, "EEEE")}
              </h2>
              <div className="pb-1">
                <span className="text-[13px] font-medium text-gray-400">
                  {sortedCalendarBookings.length}{" "}
                  {sortedCalendarBookings.length === 1 ? "Booking" : "Bookings"}
                </span>
              </div>
            </div>

            {/* Calendar Filters */}
            <div className="mb-6">
              <div className="relative rounded-xl p-1 flex overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
                <div className="absolute inset-0 rounded-xl border border-white/10" />
                <button
                  onClick={() => setCalendarFilter("upcoming")}
                  className={clsx(
                    "flex-1 py-1.5 text-[13px] font-semibold rounded-[6px] transition-all z-10",
                    calendarFilter === "upcoming"
                      ? "bg-[#3A3A3C] text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-300",
                  )}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setCalendarFilter("all")}
                  className={clsx(
                    "flex-1 py-1.5 text-[13px] font-semibold rounded-[6px] transition-all z-10",
                    calendarFilter === "all"
                      ? "bg-[#3A3A3C] text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-300",
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => setCalendarFilter("past")}
                  className={clsx(
                    "flex-1 py-1.5 text-[13px] font-semibold rounded-[6px] transition-all z-10",
                    calendarFilter === "past"
                      ? "bg-[#3A3A3C] text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-300",
                  )}
                >
                  Past
                </button>
              </div>
            </div>

            {/* Calendar Booking List */}
            <div className="space-y-3 pb-safe">
              {calendarLoading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="relative h-24 rounded-2xl animate-pulse overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
                      <div className="absolute inset-0 rounded-2xl border border-white/10" />
                    </div>
                  ))}
                </div>
              ) : sortedCalendarBookings.length > 0 ? (
                sortedCalendarBookings.map((booking) => (
                  <Link
                    href={`/app/bookings/${booking.id}`}
                    key={booking.id}
                    className="relative group block p-5 rounded-2xl active:scale-[0.98] transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
                    <div className="absolute inset-0 rounded-2xl border border-white/10" />
                    <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/[0.08] to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                    <div className="relative z-10 flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-[17px] font-bold text-white mb-0.5 leading-tight">
                          {booking.client_name}
                        </h3>
                        <p className="text-[14px] text-gray-400 font-medium">
                          {booking.services?.name || "Unknown Service"}
                        </p>
                      </div>
                      <StatusBadge status={booking.status} />
                    </div>

                    <div className="relative z-10 flex items-center gap-3 pt-3 border-t border-white/10">
                      <span className="text-[15px] font-semibold text-gray-300">
                        {format(new Date(booking.start_at), "h:mm a")}
                      </span>
                      <span className="text-[13px] text-gray-500">
                        to {format(new Date(booking.end_at), "h:mm a")}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="relative rounded-3xl py-16 flex flex-col items-center justify-center text-center overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
                  <div className="absolute inset-0 rounded-3xl border border-white/10" />
                  <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/[0.08] to-transparent opacity-60" />

                  <div className="relative z-10 w-16 h-16 mb-4 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/10 flex items-center justify-center">
                    <List className="w-8 h-8 text-white/50" />
                  </div>
                  <p className="relative z-10 text-lg font-semibold text-white mb-1">
                    No events found
                  </p>
                  <p className="relative z-10 text-sm text-white/50 mb-6">
                    Check other filters or create a new booking
                  </p>
                  <button
                    onClick={() => setIsManualBookingOpen(true)}
                    className="relative z-10 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold text-white transition-colors active:scale-95 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Booking
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* FAB - Manual Booking (Calendar view only) */}
      {viewMode === "calendar" && (
        <button
          onClick={() => setIsManualBookingOpen(true)}
          className="fixed bottom-24 right-5 w-14 h-14 bg-blue-600 rounded-full shadow-lg shadow-blue-900/40 flex items-center justify-center active:scale-95 transition-transform z-20"
        >
          <Plus className="w-7 h-7 text-white" />
        </button>
      )}

      {/* Manual Booking Modal */}
      {isManualBookingOpen && (
        <ManualBookingModal
          services={services}
          onClose={() => setIsManualBookingOpen(false)}
          onSubmit={handleManualBookingSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

// Generate 15-minute interval time slots
function generateTimeSlots() {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const hour = h.toString().padStart(2, "0");
      const minute = m.toString().padStart(2, "0");
      slots.push(`${hour}:${minute}`);
    }
  }
  return slots;
}

// Format time for display (12h with AM/PM)
function formatTimeDisplay(time: string) {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

// Get current time rounded to nearest 15 min
function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = Math.ceil(now.getMinutes() / 15) * 15;
  const adjustedHours = minutes === 60 ? (hours + 1) % 24 : hours;
  const adjustedMinutes = minutes === 60 ? 0 : minutes;
  return `${adjustedHours.toString().padStart(2, "0")}:${adjustedMinutes.toString().padStart(2, "0")}`;
}

interface ManualBookingModalProps {
  services: Service[];
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  isSubmitting: boolean;
}

function ManualBookingModal({
  services,
  onClose,
  onSubmit,
  isSubmitting,
}: ManualBookingModalProps) {
  const timeSlots = generateTimeSlots();
  const [selectedTime, setSelectedTime] = useState(getCurrentTime());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedServiceId, setSelectedServiceId] = useState("");

  const generateCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = (firstDay.getDay() + 6) % 7;
    const days: (Date | null)[] = [];

    for (let i = 0; i < startPadding; i++) days.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  };

  const calendarDays = generateCalendarDays();
  const today = startOfDay(new Date());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.set(
      "clientName",
      (document.querySelector('input[name="clientName"]') as HTMLInputElement)
        ?.value || "",
    );
    formData.set(
      "clientEmail",
      (document.querySelector('input[name="clientEmail"]') as HTMLInputElement)
        ?.value || "",
    );
    formData.set(
      "clientPhone",
      (document.querySelector('input[name="clientPhone"]') as HTMLInputElement)
        ?.value || "",
    );
    formData.set("serviceId", selectedServiceId);
    formData.set("date", format(selectedDate, "yyyy-MM-dd"));
    formData.set("time", selectedTime);

    await onSubmit(formData);
  };

  const prevMonth = () =>
    setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () =>
    setCalendarMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.12] via-white/[0.08] to-white/[0.05] backdrop-blur-3xl" />
        <div className="absolute inset-0 rounded-2xl border border-white/20" />

        <div className="relative z-10 px-4 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 backdrop-blur-md">
          <h3 className="text-[17px] font-semibold text-white">
            New Reservation
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-gray-700/50 flex items-center justify-center hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10 p-4 space-y-4">
          <div>
            <label className="text-[13px] text-gray-500 font-medium ml-1 mb-1 block">
              Client Name *
            </label>
            <input
              name="clientName"
              type="text"
              required
              placeholder="e.g. John Doe"
              className="w-full bg-[#2C2C2E] border border-transparent focus:border-blue-500 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-[13px] text-gray-500 font-medium ml-1 mb-1 block">
              Phone *
            </label>
            <input
              name="clientPhone"
              type="tel"
              required
              placeholder="e.g. +61 400 000 000"
              className="w-full bg-[#2C2C2E] border border-transparent focus:border-blue-500 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-[13px] text-gray-500 font-medium ml-1 mb-1 block">
              Email (Optional)
            </label>
            <input
              name="clientEmail"
              type="email"
              placeholder="e.g. john@example.com"
              className="w-full bg-[#2C2C2E] border border-transparent focus:border-blue-500 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-[13px] text-gray-500 font-medium ml-1 mb-1 block">
              Service *
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              required
              className="w-full bg-[#2C2C2E] border border-transparent focus:border-blue-500 rounded-xl px-4 py-3 text-white outline-none"
            >
              <option value="">Select a service...</option>
              {services.map((s: Service) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.duration_minutes} min)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[13px] text-gray-500 font-medium ml-1 mb-2 block">
              Date *
            </label>
            <div className="bg-[#2C2C2E] rounded-xl p-3">
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1 hover:bg-white/10 rounded-full"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-400" />
                </button>
                <span className="text-[15px] font-semibold text-white">
                  {format(calendarMonth, "MMMM yyyy")}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 hover:bg-white/10 rounded-full"
                >
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-1">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <div
                    key={i}
                    className="text-center text-[11px] font-medium text-gray-500 py-1"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} />;

                  const isSelected = isSameDay(day, selectedDate);
                  const isPast = isBefore(day, today);
                  const isTodayDate = isSameDay(day, today);

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={isPast}
                      onClick={() => setSelectedDate(day)}
                      className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-medium transition-all",
                        isSelected
                          ? "bg-blue-600 text-white"
                          : isPast
                            ? "text-gray-600 cursor-not-allowed"
                            : isTodayDate
                              ? "text-blue-500 hover:bg-white/10"
                              : "text-gray-300 hover:bg-white/10",
                      )}
                    >
                      {day.getDate()}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-700 text-center">
                <span className="text-[14px] text-gray-400">Selected: </span>
                <span className="text-[14px] text-white font-medium">
                  {isSameDay(selectedDate, today)
                    ? "Today"
                    : format(selectedDate, "EEE, MMM d, yyyy")}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[13px] text-gray-500 font-medium ml-1 mb-1 block">
              Time *
            </label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              required
              className="w-full bg-[#2C2C2E] border border-transparent focus:border-blue-500 rounded-xl px-4 py-3 text-white outline-none"
            >
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {formatTimeDisplay(slot)}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !selectedServiceId}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[16px] font-bold py-3.5 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Reservation"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
