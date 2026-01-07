'use client'

import { useState } from 'react'
import { Calendar, ChevronDown, Download } from 'lucide-react'
import { downloadICS, generateGoogleCalendarUrl, generateOutlookCalendarUrl } from '@/utils/calendar'
import { toast } from '@/utils/toast'

interface AddToCalendarProps {
  event: {
    title: string
    description?: string
    location?: string
    startTime: Date
    endTime: Date
  }
}

export default function AddToCalendar({ event }: AddToCalendarProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleDownloadICS = () => {
    try {
      downloadICS(event, `${event.title.replace(/\s+/g, '-').toLowerCase()}.ics`)
      toast.success('Calendar event downloaded')
      setIsOpen(false)
    } catch (error) {
      toast.error('Failed to download calendar event')
    }
  }

  const handleGoogleCalendar = () => {
    window.open(generateGoogleCalendarUrl(event), '_blank')
    setIsOpen(false)
  }

  const handleOutlookCalendar = () => {
    window.open(generateOutlookCalendarUrl(event), '_blank')
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-medium">Add to Calendar</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 overflow-hidden">
            <button
              onClick={handleGoogleCalendar}
              className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                <path fill="#fff" d="M19 12h-7v7h-2v-7H5v-2h5V5h2v5h7v2z"/>
              </svg>
              Google Calendar
            </button>

            <button
              onClick={handleOutlookCalendar}
              className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#0078D4" d="M24 7.875v8.25A3.375 3.375 0 0120.625 19.5H13.5V4.5h7.125A3.375 3.375 0 0124 7.875z"/>
                <path fill="#0364B8" d="M0 7.875v8.25A3.375 3.375 0 003.375 19.5h10.125V4.5H3.375A3.375 3.375 0 000 7.875z"/>
              </svg>
              Outlook Calendar
            </button>

            <button
              onClick={handleDownloadICS}
              className="w-full px-4 py-3 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 border-t border-gray-200 dark:border-gray-700"
            >
              <Download className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              Download .ics file
              <span className="ml-auto text-xs text-gray-500">(Apple, etc.)</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
