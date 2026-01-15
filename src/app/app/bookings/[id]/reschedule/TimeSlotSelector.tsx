"use client";

import { format } from "date-fns";
import { Clock, Loader2 } from "lucide-react";

interface TimeSlot {
  start: string; // ISO string
  end: string;
}

interface TimeSlotSelectorProps {
  slots: TimeSlot[];
  selectedTime: string | null;
  onTimeSelect: (startTime: string) => void;
  loading: boolean;
}

export default function TimeSlotSelector({
  slots,
  selectedTime,
  onTimeSelect,
  loading,
}: TimeSlotSelectorProps) {
  if (loading) {
    return (
      <div className="bg-[#1C1C1E] rounded-[14px] p-8 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-[15px] text-gray-400">Loading available times...</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="bg-[#1C1C1E] rounded-[14px] p-8 flex flex-col items-center justify-center">
        <Clock className="w-12 h-12 text-gray-600 mb-3" />
        <p className="text-[17px] font-medium text-gray-400 mb-1">
          No Available Times
        </p>
        <p className="text-[15px] text-gray-500 text-center">
          Please select a different date
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#1C1C1E] rounded-[14px] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-5 h-5 text-gray-400" />
        <h3 className="text-[17px] font-semibold">Available Times</h3>
      </div>

      <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
        {slots.map((slot) => {
          const startDate = new Date(slot.start);
          const _endDate = new Date(slot.end);
          const timeDisplay = format(startDate, "h:mm a");
          const isSelected = selectedTime === slot.start;

          return (
            <button
              key={slot.start}
              onClick={() => onTimeSelect(slot.start)}
              type="button"
              className={`
                                px-3 py-3 rounded-lg text-[15px] font-medium transition-colors
                                ${
                                  isSelected
                                    ? "bg-blue-500 text-white"
                                    : "bg-black/40 text-white hover:bg-black/60 active:bg-black/80"
                                }
                            `}
            >
              {timeDisplay}
            </button>
          );
        })}
      </div>

      <p className="text-[13px] text-gray-500 mt-3 text-center">
        Tap a time to select
      </p>
    </div>
  );
}
