"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  format,
  isToday,
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
  ChevronRight,
  ChevronLeft,
  CalendarX,
  CalendarCheck,
  History,
  AlertCircle,
  Plus,
  Loader2,
} from "lucide-react";
import clsx from "clsx";
import type { Service } from "@/types";
import { getCalendarEvents, createManualBooking } from "../week/actions";

interface CalendarBooking {
  id: string;
  status: string;
  start_at: string;
  end_at: string;
  client_name: string;
  services: { name: string } | null;
}

interface BookingsViewProps {
  pendingBookings: { id: string }[];
  services: Service[];
}

type FilterType = "all" | "upcoming" | "past" | "cancelled";

export default function BookingsView({
  pendingBookings,
  services,
}: BookingsViewProps) {
  const router = useRouter();

  // Calendar state
  const [weekDate, setWeekDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Manual booking modal
  const [isManualBookingOpen, setIsManualBookingOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Week strip days
  const startOfCurrentWeek = startOfWeek(weekDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }).map((_, i) =>
    addDays(startOfCurrentWeek, i),
  );

  // Navigation
  const nextWeek = () => setWeekDate((d) => addWeeks(d, 1));
  const prevWeek = () => setWeekDate((d) => subWeeks(d, 1));
  const goToToday = () => {
    const today = new Date();
    setWeekDate(today);
    setSelectedDate(today);
  };

  // Fetch bookings when week changes
  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);
      const res = await getCalendarEvents(weekDate.toISOString());
      if (res && !res.error) {
        setBookings(res.bookings || []);
      }
      setLoading(false);
    };
    fetchBookings();
  }, [weekDate]);

  // Filter bookings for selected date
  const filteredBookings = useMemo(() => {
    let result = bookings.filter((b) =>
      isSameDay(new Date(b.start_at), selectedDate),
    );

    // Apply status filter
    if (filter === "upcoming") {
      const now = new Date();
      result = result.filter(
        (b) => b.status !== "cancelled" && !isBefore(new Date(b.start_at), now),
      );
    } else if (filter === "past") {
      const now = new Date();
      result = result.filter(
        (b) => b.status !== "cancelled" && isBefore(new Date(b.start_at), now),
      );
    } else if (filter === "cancelled") {
      result = result.filter((b) => b.status === "cancelled");
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.client_name.toLowerCase().includes(query) ||
          b.services?.name.toLowerCase().includes(query),
      );
    }

    // Sort by time
    return result.sort(
      (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
    );
  }, [bookings, selectedDate, filter, searchQuery]);

  // Check if day has bookings (for indicator dots)
  const getDayBookingCount = (d: Date) => {
    return bookings.filter(
      (b) => isSameDay(new Date(b.start_at), d) && b.status !== "cancelled",
    ).length;
  };

  // Handle manual booking submit
  async function handleManualBookingSubmit(formData: FormData) {
    setIsSubmitting(true);
    const res = await createManualBooking(formData);
    setIsSubmitting(false);

    if (res?.error) {
      alert(res.error);
      return;
    }

    // Refresh bookings
    const updatedRes = await getCalendarEvents(weekDate.toISOString());
    if (updatedRes && !updatedRes.error) {
      setBookings(updatedRes.bookings || []);
    }
    setIsManualBookingOpen(false);
    router.refresh();
  }

  const glassCard =
    "relative rounded-2xl overflow-hidden bg-white/[0.08] backdrop-blur-xl border border-white/[0.08]";

  // Status badge
  const StatusBadge = ({ status }: { status: string }) => {
    const configs: Record<string, { bg: string; text: string; label: string }> =
      {
        confirmed: {
          bg: "bg-emerald-500/15 border-emerald-500/20",
          text: "text-emerald-400",
          label: "Confirmed",
        },
        pending_reschedule: {
          bg: "bg-orange-500/15 border-orange-500/20",
          text: "text-orange-400",
          label: "Pending",
        },
        cancelled: {
          bg: "bg-red-500/10 border-red-500/10",
          text: "text-red-400",
          label: "Cancelled",
        },
      };
    const config = configs[status] || {
      bg: "bg-gray-500/10",
      text: "text-gray-400",
      label: status,
    };

    return (
      <div
        className={clsx(
          "flex items-center gap-1.5 px-2 py-0.5 rounded-full border",
          config.bg,
        )}
      >
        <div
          className={clsx(
            "w-1.5 h-1.5 rounded-full",
            config.text.replace("text-", "bg-"),
          )}
        />
        <span
          className={clsx(
            "text-[10px] font-medium tracking-wide uppercase",
            config.text,
          )}
        >
          {config.label}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] font-sans pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#1a1a1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="px-5 pt-14 pb-4">
          {/* Title Row */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Bookings
            </h1>
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
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or service..."
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

          {/* Month & Navigation */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-[15px] font-medium text-white">
              {format(weekDate, "MMMM yyyy")}
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
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
                  onClick={goToToday}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-full text-xs font-semibold text-white transition-colors active:scale-95"
                >
                  Today
                </button>
              )}
            </div>
          </div>

          {/* Week Strip */}
          <div className="flex justify-between items-center">
            {days.map((d) => {
              const isSelected = isSameDay(d, selectedDate);
              const isCurrentDay = isToday(d);
              const bookingCount = getDayBookingCount(d);

              return (
                <button
                  key={d.toISOString()}
                  onClick={() => setSelectedDate(d)}
                  className="flex flex-col items-center gap-1 w-[3.25rem] relative group"
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
                      "w-10 h-10 flex items-center justify-center rounded-full transition-all duration-200",
                      isSelected
                        ? "bg-blue-600 scale-105 shadow-lg shadow-blue-500/30"
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

                  {/* Booking indicator */}
                  {bookingCount > 0 && !isSelected && (
                    <div className="absolute -bottom-1 flex gap-0.5">
                      {Array.from({ length: Math.min(bookingCount, 3) }).map(
                        (_, i) => (
                          <div
                            key={i}
                            className={clsx(
                              "w-1 h-1 rounded-full",
                              isCurrentDay ? "bg-blue-500" : "bg-white/60",
                            )}
                          />
                        ),
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Pending Actions Banner */}
      {pendingBookings.length > 0 && (
        <div className="px-5 pt-4">
          <div
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
          </div>
        </div>
      )}

      {/* Content */}
      <main className="px-5 py-4">
        {/* Date Header & Filter */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              {isToday(selectedDate)
                ? "Today"
                : format(selectedDate, "EEEE, MMM d")}
            </h2>
            <p className="text-sm text-gray-500">
              {filteredBookings.length} booking
              {filteredBookings.length !== 1 ? "s" : ""}
              {filter !== "all" && ` · ${filter}`}
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
          {[
            { id: "all" as FilterType, label: "All", icon: CalendarIcon },
            {
              id: "upcoming" as FilterType,
              label: "Upcoming",
              icon: CalendarCheck,
            },
            { id: "past" as FilterType, label: "Past", icon: History },
            {
              id: "cancelled" as FilterType,
              label: "Cancelled",
              icon: CalendarX,
            },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setFilter(id)}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                filter === id
                  ? "bg-blue-500 text-white"
                  : "bg-white/[0.06] text-gray-400 hover:bg-white/[0.1]",
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Booking List */}
        <div className="space-y-3">
          {loading ? (
            // Loading skeleton
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={clsx(glassCard, "h-24 animate-pulse")} />
            ))
          ) : filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <Link
                key={booking.id}
                href={`/app/bookings/${booking.id}`}
                className={clsx(
                  glassCard,
                  "block p-4 transition-all active:scale-[0.98] hover:bg-white/[0.12]",
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-[17px] font-bold text-white mb-0.5">
                      {booking.client_name}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {booking.services?.name || "Unknown Service"}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </div>

                <div className="flex items-center gap-4 pt-2 border-t border-white/10">
                  <span className="flex items-center gap-1.5 text-sm text-gray-300">
                    <Clock className="w-4 h-4 text-gray-500" />
                    {format(new Date(booking.start_at), "h:mm a")}
                  </span>
                  <span className="text-sm text-gray-500">
                    → {format(new Date(booking.end_at), "h:mm a")}
                  </span>
                </div>
              </Link>
            ))
          ) : (
            // Empty state
            <div className={clsx(glassCard, "py-12 text-center")}>
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-white/[0.06] flex items-center justify-center">
                <CalendarIcon className="w-7 h-7 text-gray-500" />
              </div>
              <h3 className="font-semibold text-white mb-1">No bookings</h3>
              <p className="text-sm text-gray-500 mb-4">
                {filter !== "all"
                  ? `No ${filter} bookings for this day`
                  : "No bookings scheduled for this day"}
              </p>
              <button
                onClick={() => setIsManualBookingOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-semibold text-white transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Booking
              </button>
            </div>
          )}
        </div>

        {/* Search results count */}
        {searchQuery && (
          <p className="text-center text-gray-500 text-sm mt-4">
            {filteredBookings.length} result
            {filteredBookings.length !== 1 ? "s" : ""} for &ldquo;{searchQuery}
            &rdquo;
          </p>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={() => setIsManualBookingOpen(true)}
        className="fixed bottom-24 right-5 w-14 h-14 bg-blue-600 rounded-full shadow-lg shadow-blue-900/40 flex items-center justify-center active:scale-95 transition-transform z-20"
      >
        <Plus className="w-7 h-7 text-white" />
      </button>

      {/* Manual Booking Modal */}
      {isManualBookingOpen && (
        <ManualBookingModal
          services={services}
          initialDate={selectedDate}
          onClose={() => setIsManualBookingOpen(false)}
          onSubmit={handleManualBookingSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}

// ============================================
// Manual Booking Modal
// ============================================

function generateTimeSlots() {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
      );
    }
  }
  return slots;
}

function formatTimeDisplay(time: string) {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

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
  initialDate: Date;
  onClose: () => void;
  onSubmit: (formData: FormData) => void;
  isSubmitting: boolean;
}

function ManualBookingModal({
  services,
  initialDate,
  onClose,
  onSubmit,
  isSubmitting,
}: ManualBookingModalProps) {
  const timeSlots = generateTimeSlots();
  const [selectedTime, setSelectedTime] = useState(getCurrentTime());
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [calendarMonth, setCalendarMonth] = useState(initialDate);
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
    const form = e.target as HTMLFormElement;
    const formData = new FormData();
    formData.set(
      "clientName",
      (form.elements.namedItem("clientName") as HTMLInputElement)?.value || "",
    );
    formData.set(
      "clientEmail",
      (form.elements.namedItem("clientEmail") as HTMLInputElement)?.value || "",
    );
    formData.set(
      "clientPhone",
      (form.elements.namedItem("clientPhone") as HTMLInputElement)?.value || "",
    );
    formData.set("serviceId", selectedServiceId);
    formData.set("date", format(selectedDate, "yyyy-MM-dd"));
    formData.set("time", selectedTime);
    await onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto bg-[#1c1c1e] border border-white/10">
        {/* Header */}
        <div className="px-4 py-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#1c1c1e] z-10">
          <h3 className="text-[17px] font-semibold text-white">New Booking</h3>
          <button
            onClick={onClose}
            type="button"
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Client Name */}
          <div>
            <label className="text-[13px] text-gray-500 font-medium mb-1.5 block">
              Client Name *
            </label>
            <input
              name="clientName"
              type="text"
              required
              placeholder="John Doe"
              className="w-full bg-white/[0.06] border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none transition-all"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="text-[13px] text-gray-500 font-medium mb-1.5 block">
              Phone *
            </label>
            <input
              name="clientPhone"
              type="tel"
              required
              placeholder="+61 400 000 000"
              className="w-full bg-white/[0.06] border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none transition-all"
            />
          </div>

          {/* Email */}
          <div>
            <label className="text-[13px] text-gray-500 font-medium mb-1.5 block">
              Email (Optional)
            </label>
            <input
              name="clientEmail"
              type="email"
              placeholder="john@example.com"
              className="w-full bg-white/[0.06] border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 outline-none transition-all"
            />
          </div>

          {/* Service */}
          <div>
            <label className="text-[13px] text-gray-500 font-medium mb-1.5 block">
              Service *
            </label>
            <select
              value={selectedServiceId}
              onChange={(e) => setSelectedServiceId(e.target.value)}
              required
              className="w-full bg-white/[0.06] border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-white outline-none transition-all"
            >
              <option value="">Select a service...</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.duration_minutes} min)
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="text-[13px] text-gray-500 font-medium mb-1.5 block">
              Date *
            </label>
            <div className="bg-white/[0.06] border border-white/10 rounded-xl p-3">
              {/* Month nav */}
              <div className="flex items-center justify-between mb-3">
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth(
                      (d) => new Date(d.getFullYear(), d.getMonth() - 1, 1),
                    )
                  }
                  className="p-1 hover:bg-white/10 rounded-full"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-400" />
                </button>
                <span className="text-[15px] font-semibold text-white">
                  {format(calendarMonth, "MMMM yyyy")}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCalendarMonth(
                      (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1),
                    )
                  }
                  className="p-1 hover:bg-white/10 rounded-full"
                >
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Weekday headers */}
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

              {/* Days grid */}
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

              {/* Selected date display */}
              <div className="mt-3 pt-3 border-t border-white/10 text-center">
                <span className="text-sm text-gray-400">Selected: </span>
                <span className="text-sm text-white font-medium">
                  {isSameDay(selectedDate, today)
                    ? "Today"
                    : format(selectedDate, "EEE, MMM d")}
                </span>
              </div>
            </div>
          </div>

          {/* Time */}
          <div>
            <label className="text-[13px] text-gray-500 font-medium mb-1.5 block">
              Time *
            </label>
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              required
              className="w-full bg-white/[0.06] border border-white/10 focus:border-blue-500 rounded-xl px-4 py-3 text-white outline-none transition-all"
            >
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {formatTimeDisplay(slot)}
                </option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !selectedServiceId}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Booking"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
