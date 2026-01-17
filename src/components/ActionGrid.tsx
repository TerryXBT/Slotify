"use client";

import Link from "next/link";
import { CalendarOff, Clock, CalendarCheck, Share2 } from "lucide-react";

export default function ActionGrid() {
  const actions = [
    {
      label: "Add Busy Block",
      icon: <CalendarOff className="w-6 h-6" />,
      href: "/app/busy/new",
      color: "text-red-500",
    },
    {
      label: "Availability",
      icon: <Clock className="w-6 h-6" />,
      href: "/app/settings/availability",
      color: "text-green-500",
    },
    {
      label: "All Bookings",
      icon: <CalendarCheck className="w-6 h-6" />,
      href: "/app/bookings",
      color: "text-purple-500",
    },
    {
      label: "Share Link",
      icon: <Share2 className="w-6 h-6" />,
      href: "/app/share",
      color: "text-orange-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className="relative flex items-center gap-4 p-4 rounded-2xl active:scale-[0.98] transition-all group overflow-hidden"
        >
          {/* Glassmorphism Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.07] via-white/[0.05] to-white/[0.03] backdrop-blur-2xl" />
          <div className="absolute inset-0 rounded-2xl border border-white/10" />
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/[0.08] to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

          <div className="relative z-10 w-12 h-12 rounded-full bg-white/[0.08] backdrop-blur-xl border border-white/10 flex items-center justify-center group-active:scale-95 transition-transform">
            <div className={action.color}>{action.icon}</div>
          </div>
          <span className="relative z-10 text-sm font-semibold text-white">
            {action.label}
          </span>
        </Link>
      ))}
    </div>
  );
}
