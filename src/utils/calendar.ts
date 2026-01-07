import { format } from 'date-fns'

interface CalendarEvent {
  title: string
  description?: string
  location?: string
  startTime: Date
  endTime: Date
  url?: string
}

// Format date for iCalendar format (YYYYMMDDTHHMMSS)
const formatICalDate = (date: Date): string => {
  return format(date, "yyyyMMdd'T'HHmmss")
}

// Generate .ics file content
export const generateICS = (event: CalendarEvent): string => {
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Slotify//Booking Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${Date.now()}@slotify.com
DTSTAMP:${formatICalDate(new Date())}
DTSTART:${formatICalDate(event.startTime)}
DTEND:${formatICalDate(event.endTime)}
SUMMARY:${event.title}${event.description ? `\nDESCRIPTION:${event.description}` : ''}${event.location ? `\nLOCATION:${event.location}` : ''}${event.url ? `\nURL:${event.url}` : ''}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`

  return icsContent
}

// Download .ics file
export const downloadICS = (event: CalendarEvent, filename: string = 'booking.ics') => {
  const icsContent = generateICS(event)
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}

// Generate Google Calendar URL
export const generateGoogleCalendarUrl = (event: CalendarEvent): string => {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatICalDate(event.startTime)}/${formatICalDate(event.endTime)}`,
    details: event.description || '',
    location: event.location || '',
  })

  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

// Generate Apple Calendar URL (iOS/macOS)
export const generateAppleCalendarUrl = (event: CalendarEvent): string => {
  // Apple Calendar uses the same format as Google Calendar
  return generateGoogleCalendarUrl(event)
}

// Generate Outlook Calendar URL
export const generateOutlookCalendarUrl = (event: CalendarEvent): string => {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: event.startTime.toISOString(),
    enddt: event.endTime.toISOString(),
    body: event.description || '',
    location: event.location || '',
  })

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}
