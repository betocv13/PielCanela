import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
