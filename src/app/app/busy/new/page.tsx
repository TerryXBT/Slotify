import { createBusyBlock } from '../actions'
import { ArrowLeft, Clock, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function NewBusyBlockPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black font-sans pb-24 text-gray-900 dark:text-gray-100">

            {/* Header */}
            <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md px-5 pt-12 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/app/today" className="text-blue-600 font-medium text-base">
                        Cancel
                    </Link>
                </div>
                <h1 className="text-lg font-bold">New Busy Block</h1>
                <div className="w-12"></div> {/* Spacer for center alignment */}
            </header>

            <main className="px-5 mt-4">
                <form action={createBusyBlock} className="space-y-6">

                    {/* Title Input */}
                    <div className="bg-[#1C1C1E] rounded-xl px-4 py-1 shadow-sm border border-gray-800">
                        <input
                            name="title"
                            type="text"
                            placeholder="Title (e.g., Lunch, Appointment)"
                            className="w-full py-3 bg-transparent text-lg font-medium outline-none placeholder:text-gray-400"
                        />
                    </div>

                    {/* Time Selection */}
                    <div className="bg-[#1C1C1E] rounded-xl shadow-sm border border-gray-800 overflow-hidden">
                        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <span className="font-medium">Date</span>
                            </div>
                            <input
                                name="date"
                                type="date"
                                required
                                className="bg-transparent text-right outline-none font-semibold text-blue-600"
                                defaultValue={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <span className="font-medium">Starts</span>
                            </div>
                            <input
                                name="startTime"
                                type="time"
                                required
                                className="bg-transparent text-right outline-none font-semibold text-white"
                                defaultValue="12:00"
                            />
                        </div>
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center text-gray-400">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <span className="font-medium">Ends</span>
                            </div>
                            <input
                                name="endTime"
                                type="time"
                                required
                                className="bg-transparent text-right outline-none font-semibold text-white"
                                defaultValue="13:00"
                            />
                        </div>
                    </div>

                    <p className="text-sm text-gray-500 px-2">
                        Clients will not be able to book you during this time.
                    </p>

                    <button type="submit" className="w-full bg-black text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all">
                        Block Time
                    </button>
                </form>
            </main>
        </div>
    )
}
