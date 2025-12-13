import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { toZonedTime, format } from 'date-fns-tz'

// Utility for merging Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format price to currency
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price)
}

// Format date for display
export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

// Format time for display
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const hour = parseInt(hours, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${minutes} ${ampm}`
}

// Generate Venmo payment link
export function generateVenmoLink(
  username: string,
  amount: number,
  orderNumber: string
): { deepLink: string; webLink: string } {
  const cleanUsername = username.replace('@', '')
  const note = encodeURIComponent(`Order-${orderNumber}`)

  return {
    deepLink: `venmo://paycharge?txn=pay&recipients=${cleanUsername}&amount=${amount.toFixed(2)}&note=${note}`,
    webLink: `https://venmo.com/?txn=pay&recipients=${cleanUsername}&amount=${amount.toFixed(2)}&note=${note}`,
  }
}

// Generate Cash App payment link
export function generateCashAppLink(
  cashtag: string,
  amount: number
): string {
  const cleanCashtag = cashtag.replace('$', '')
  return `https://cash.app/$${cleanCashtag}/${amount.toFixed(2)}`
}

// Generate time slots between open and close times
export function generateTimeSlots(
  openTime: string,
  closeTime: string,
  intervalMinutes: number = 15
): string[] {
  const slots: string[] = []
  const [openHour, openMin] = openTime.split(':').map(Number)
  const [closeHour, closeMin] = closeTime.split(':').map(Number)

  let currentHour = openHour
  let currentMin = openMin

  while (
    currentHour < closeHour ||
    (currentHour === closeHour && currentMin < closeMin)
  ) {
    const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`
    slots.push(timeString)

    currentMin += intervalMinutes
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60)
      currentMin = currentMin % 60
    }
  }

  return slots
}

// Format phone number
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  return phone
}

// Validate phone number
export function isValidPhoneNumber(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length === 10
}

// Get business timezone from environment variable (defaults to America/Phoenix)
export function getBusinessTimezone(): string {
  return process.env.BUSINESS_TIMEZONE || 'America/Phoenix'
}

// Get current date in business timezone as YYYY-MM-DD string
export function getTodayInBusinessTZ(): string {
  const timezone = getBusinessTimezone()
  const now = new Date()
  const zonedDate = toZonedTime(now, timezone)
  return format(zonedDate, 'yyyy-MM-dd', { timeZone: timezone })
}

// Get current Date object in business timezone
export function getNowInBusinessTZ(): Date {
  const timezone = getBusinessTimezone()
  return toZonedTime(new Date(), timezone)
}

// Generate .ics calendar file content for pickup
export function generateCalendarFile(
  orderNumber: string,
  pickupDate: string,
  pickupTime: string
): string {
  // Parse date and time (pickupDate is YYYY-MM-DD, pickupTime is HH:MM)
  const [year, month, day] = pickupDate.split('-').map(Number)
  const [hour, minute] = pickupTime.split(':').map(Number)

  // Create start datetime
  const startDate = new Date(year, month - 1, day, hour, minute)

  // Create end datetime (15 minutes later)
  const endDate = new Date(startDate.getTime() + 15 * 60 * 1000)

  // Format dates for iCalendar (YYYYMMDDTHHMMSS)
  const formatICalDate = (date: Date): string => {
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
  }

  const dtStart = formatICalDate(startDate)
  const dtEnd = formatICalDate(endDate)
  const dtStamp = formatICalDate(new Date())

  const location = '339 E Marion St, Des Moines, IA 50315'
  const title = `Piel Canela Pickup - Order #${orderNumber}`
  const description = `Order #${orderNumber}\\n\\nPickup Instructions:\\nPlease go to the garage door entrance. You're welcome to park in the garage or walk up—just send us a message on Instagram or Facebook when you arrive so we can bring your order out promptly.\\n\\nAddress: ${location}`

  // Generate unique ID
  const uid = `pielcanela-${orderNumber}-${Date.now()}@pielcanela.com`

  // Build .ics file content (following RFC 5545)
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Piel Canela//Order Pickup//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')

  return icsContent
}

// Download .ics calendar file
export function downloadCalendarFile(
  orderNumber: string,
  pickupDate: string,
  pickupTime: string
): void {
  const icsContent = generateCalendarFile(orderNumber, pickupDate, pickupTime)

  // Create blob and download
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `pielcanela-order-${orderNumber}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(link.href)
}
