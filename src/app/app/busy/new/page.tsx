import { createBusyBlock } from "../actions";
import { Clock, Calendar, Check } from "lucide-react";
import Link from "next/link";

export default function NewBusyBlockPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans pb-safe">
      {/* iOS Modal Header */}
      <header className="sticky top-0 z-30 bg-[#1C1C1E]/80 backdrop-blur-md border-b border-gray-800/50 pt-safe-top">
        <div className="px-5 h-[52px] flex items-center justify-between">
          <Link
            href="/app/today"
            className="text-[17px] text-blue-500 active:opacity-50 transition-opacity"
          >
            Cancel
          </Link>
          <h1 className="text-[17px] font-semibold text-white">New Block</h1>
          <div className="w-[50px]"></div> {/* Spacer for balance */}
        </div>
      </header>

      <main className="px-5 pt-6">
        <form action={createBusyBlock} className="space-y-6">
          {/* Section 1: Title */}
          <div className="space-y-2">
            <div className="overflow-hidden rounded-xl bg-[#1C1C1E] divide-y divide-gray-800/50">
              <div className="px-4 py-3">
                <input
                  name="title"
                  type="text"
                  placeholder="Title (e.g. Lunch)"
                  className="w-full bg-transparent text-[17px] text-white placeholder:text-gray-500 outline-none"
                />
              </div>
            </div>
            <p className="px-4 text-[13px] text-gray-500">
              Give your busy block a name.
            </p>
          </div>

          {/* Section 2: Time Settings */}
          <div className="space-y-2">
            <div className="overflow-hidden rounded-xl bg-[#1C1C1E] divide-y divide-gray-800/50">
              {/* Date Row */}
              <div className="flex items-center justify-between px-4 py-3.5 active:bg-gray-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-red-500" />
                  <span className="text-[17px] text-white">Date</span>
                </div>
                <input
                  name="date"
                  type="date"
                  required
                  className="bg-transparent text-[17px] text-blue-500 font-medium text-right outline-none min-w-[140px]"
                  defaultValue={new Date().toISOString().split("T")[0]}
                />
              </div>

              {/* Start Time Row */}
              <div className="flex items-center justify-between px-4 py-3.5 active:bg-gray-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <span className="text-[17px] text-white">Starts</span>
                </div>
                <input
                  name="startTime"
                  type="time"
                  required
                  className="bg-transparent text-[17px] text-white font-medium text-right outline-none bg-gray-700/50 px-2 py-1 rounded"
                  defaultValue="12:00"
                />
              </div>

              {/* End Time Row */}
              <div className="flex items-center justify-between px-4 py-3.5 active:bg-gray-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-[17px] text-white">Ends</span>
                </div>
                <input
                  name="endTime"
                  type="time"
                  required
                  className="bg-transparent text-[17px] text-white font-medium text-right outline-none bg-gray-700/50 px-2 py-1 rounded"
                  defaultValue="13:00"
                />
              </div>
            </div>
            <p className="px-4 text-[13px] text-gray-500">
              Clients will be blocked from booking during this time.
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[17px] font-bold py-3.5 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Block Time
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
