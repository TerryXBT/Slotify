'use client'

import { useState } from 'react'
import { startOfMonth, endOfMonth, eachDayOfInterval, format, addMonths, subMonths, startOfDay, isSameDay } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface RescheduleCalendarProps {
    selectedDate: Date | null
    onDateSelect: (date: Date) => void
}

export default function RescheduleCalendar({ selectedDate, onDateSelect }: RescheduleCalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date())

    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd })

    // Get the day of week for the first day (0 = Sunday)
    const firstDayOfWeek = monthStart.getDay()

    const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

    const isDateSelectable = (date: Date) => {
        // Only allow future dates
        return date >= startOfDay(new Date())
    }

    return (
        <div className="bg-[#1C1C1E] rounded-[14px] p-4">
            {/* Month Header */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={handlePrevMonth}
                    className="p-2 -ml-2 rounded-full active:bg-white/10 transition-colors"
                    type="button"
                >
                    <ChevronLeft className="w-5 h-5 text-blue-500" />
                </button>
                <div className="text-[17px] font-semibold">
                    {format(currentMonth, 'MMMM yyyy')}
                </div>
                <button
                    onClick={handleNextMonth}
                    className="p-2 -mr-2 rounded-full active:bg-white/10 transition-colors"
                    type="button"
                >
                    <ChevronRight className="w-5 h-5 text-blue-500" />
                </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                    <div key={i} className="text-center text-[11px] text-gray-500 font-medium py-1">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Actual days */}
                {calendarDays.map((day) => {
                    const isSelectable = isDateSelectable(day)
                    const isSelected = selectedDate && isSameDay(day, selectedDate)

                    return (
                        <button
                            key={day.toString()}
                            onClick={() => isSelectable && onDateSelect(day)}
                            disabled={!isSelectable}
                            type="button"
                            className={`
                                aspect-square rounded-lg text-[15px] font-medium transition-colors
                                ${isSelected
                                    ? 'bg-blue-500 text-white'
                                    : isSelectable
                                        ? 'text-white hover:bg-white/10 active:bg-white/20'
                                        : 'text-gray-600 cursor-not-allowed'
                                }
                            `}
                        >
                            {format(day, 'd')}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
