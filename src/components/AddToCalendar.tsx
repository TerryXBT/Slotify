"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronDown, X } from "lucide-react";
import {
  downloadICS,
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
} from "@/utils/calendar";
import { toast } from "@/utils/toast";

interface AddToCalendarProps {
  event: {
    title: string;
    description?: string;
    location?: string;
    startTime: Date;
    endTime: Date;
  };
}

// Apple Calendar Icon - Mimics the real Apple Calendar app icon
function AppleCalendarIcon() {
  const today = new Date().getDate();
  return (
    <div className="w-10 h-10 rounded-xl bg-white overflow-hidden shadow-sm flex flex-col">
      <div className="h-3 bg-red-500 flex-shrink-0" />
      <div className="flex-1 flex items-center justify-center bg-white">
        <span className="text-[#1d1d1f] font-bold text-lg leading-none">
          {today}
        </span>
      </div>
    </div>
  );
}

// Google Calendar Icon - Mimics the real Google Calendar icon
function GoogleCalendarIcon() {
  return (
    <div className="w-10 h-10 rounded-lg overflow-hidden shadow-sm flex flex-col relative bg-white">
      {/* Top colored border */}
      <div className="h-2.5 flex">
        <div className="flex-1 bg-[#4285F4]" />
        <div className="flex-1 bg-[#34A853]" />
      </div>
      {/* Calendar body */}
      <div className="flex-1 flex items-center justify-center bg-white">
        <span className="text-[#4285F4] font-bold text-base">31</span>
      </div>
      {/* Bottom border */}
      <div className="h-1 flex">
        <div className="flex-1 bg-[#FBBC04]" />
        <div className="flex-1 bg-[#EA4335]" />
      </div>
    </div>
  );
}

// Outlook Calendar Icon - Mimics Microsoft Outlook
function OutlookCalendarIcon() {
  return (
    <div className="w-10 h-10 rounded-lg bg-[#0078D4] flex items-center justify-center shadow-sm">
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <rect
          x="4"
          y="6"
          width="16"
          height="14"
          rx="2"
          fill="white"
          fillOpacity="0.2"
        />
        <rect x="5" y="7" width="14" height="12" rx="1.5" fill="white" />
        <rect x="4" y="5" width="16" height="3" fill="white" />
        <text
          x="12"
          y="16"
          textAnchor="middle"
          fill="#0078D4"
          fontSize="8"
          fontWeight="bold"
        >
          O
        </text>
      </svg>
    </div>
  );
}

// ICS Download Icon
function DownloadIcon() {
  return (
    <div className="w-10 h-10 rounded-lg bg-gray-500 flex items-center justify-center shadow-sm">
      <svg
        className="w-5 h-5 text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
    </div>
  );
}

export default function AddToCalendar({ event }: AddToCalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Ensure portal only renders on client (hydration safety pattern)
  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  const handleAppleCalendar = () => {
    try {
      downloadICS(
        event,
        `${event.title.replace(/\s+/g, "-").toLowerCase()}.ics`,
      );
      toast.success("Opening Apple Calendar...");
      setIsOpen(false);
    } catch {
      toast.error("Failed to download calendar event");
    }
  };

  const handleGoogleCalendar = () => {
    window.open(generateGoogleCalendarUrl(event), "_blank");
    setIsOpen(false);
  };

  const handleOutlookCalendar = () => {
    window.open(generateOutlookCalendarUrl(event), "_blank");
    setIsOpen(false);
  };

  const handleDownloadICS = () => {
    try {
      downloadICS(
        event,
        `${event.title.replace(/\s+/g, "-").toLowerCase()}.ics`,
      );
      toast.success("Calendar event downloaded");
      setIsOpen(false);
    } catch {
      toast.error("Failed to download calendar event");
    }
  };

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-[#2c2c2e] rounded-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">Add to Calendar</h3>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Options */}
        <div className="py-2">
          {/* Apple Calendar */}
          <button
            onClick={handleAppleCalendar}
            className="w-full px-5 py-4 text-left text-white hover:bg-white/[0.08] transition-colors flex items-center gap-4 active:bg-white/[0.12]"
          >
            <AppleCalendarIcon />
            <div>
              <span className="font-medium block">Apple Calendar</span>
              <span className="text-xs text-gray-500">iPhone, iPad, Mac</span>
            </div>
          </button>

          {/* Google Calendar */}
          <button
            onClick={handleGoogleCalendar}
            className="w-full px-5 py-4 text-left text-white hover:bg-white/[0.08] transition-colors flex items-center gap-4 active:bg-white/[0.12]"
          >
            <GoogleCalendarIcon />
            <div>
              <span className="font-medium block">Google Calendar</span>
              <span className="text-xs text-gray-500">Opens in browser</span>
            </div>
          </button>

          {/* Outlook Calendar */}
          <button
            onClick={handleOutlookCalendar}
            className="w-full px-5 py-4 text-left text-white hover:bg-white/[0.08] transition-colors flex items-center gap-4 active:bg-white/[0.12]"
          >
            <OutlookCalendarIcon />
            <div>
              <span className="font-medium block">Outlook Calendar</span>
              <span className="text-xs text-gray-500">Opens in browser</span>
            </div>
          </button>

          {/* Divider */}
          <div className="mx-5 my-2 border-t border-white/10" />

          {/* Download ICS */}
          <button
            onClick={handleDownloadICS}
            className="w-full px-5 py-4 text-left text-gray-400 hover:bg-white/[0.08] hover:text-white transition-colors flex items-center gap-4 active:bg-white/[0.12]"
          >
            <DownloadIcon />
            <div>
              <span className="font-medium block">Download .ics file</span>
              <span className="text-xs text-gray-500">
                For other calendar apps
              </span>
            </div>
          </button>
        </div>

        {/* Cancel Button */}
        <div className="px-5 pb-5 pt-2">
          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-medium rounded-xl transition-colors active:scale-[0.98]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 w-full max-w-xs px-5 py-3 bg-white/[0.08] border border-white/10 rounded-xl text-white transition-all hover:bg-white/[0.12] active:scale-[0.98]"
      >
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-medium">Add to Calendar</span>
        <ChevronDown className="w-4 h-4 ml-1" />
      </button>

      {/* Render modal in portal to avoid parent overflow clipping */}
      {mounted && modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
