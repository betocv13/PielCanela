import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getTodayInBusinessTZ, getNowInBusinessTZ } from '@/lib/utils'
import { TIME_CONSTANTS, ORDER_STATUS } from '@/lib/constants'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET - Get available time slots for a date
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json(
        { error: 'Date parameter is required' },
        { status: 400 }
      )
    }

    // Get max orders per slot from settings
    const { data: settingsData } = await supabase
      .from('settings')
      .select('key, value')
      .eq('key', 'max_orders_per_slot')
      .single()

    const maxOrdersPerSlot = settingsData ? Number(settingsData.value) : 2

    // Get pickup date for this specific date
    const { data: pickupDateData } = await supabase
      .from('pickup_dates')
      .select('*')
      .eq('date', date)
      .single()

    if (!pickupDateData) {
      return NextResponse.json({
        date,
        slots: [],
        message: 'No pickup available on this date'
      })
    }

    // Generate all possible time slots
    const slots: string[] = []
    const [openHour, openMin] = pickupDateData.open_time.split(':').map(Number)
    const [closeHour, closeMin] = pickupDateData.close_time.split(':').map(Number)

    let currentHour = openHour
    let currentMin = openMin

    while (
      currentHour < closeHour ||
      (currentHour === closeHour && currentMin < closeMin)
    ) {
      const timeStr = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`
      slots.push(timeStr)

      // Increment by configured slot interval
      currentMin += TIME_CONSTANTS.SLOT_INTERVAL_MINUTES
      if (currentMin >= 60) {
        currentMin = 0
        currentHour += 1
      }
    }

    // Get order counts for each slot (only count active orders)
    const { data: orders } = await supabase
      .from('orders')
      .select('pickup_time')
      .eq('pickup_date', date)
      .in('status', [ORDER_STATUS.PENDING, ORDER_STATUS.READY])

    // Count orders per slot
    const slotCounts: Record<string, number> = {}
    for (const order of orders || []) {
      const time = order.pickup_time.slice(0, 5) // Get HH:MM format
      slotCounts[time] = (slotCounts[time] || 0) + 1
    }

    // Filter out full slots
    const availableSlots = slots.filter(slot => {
      const count = slotCounts[slot] || 0
      return count < maxOrdersPerSlot
    })

    // Also filter out slots that are in the past (for today)
    // Use business timezone for date and time comparison
    const now = getNowInBusinessTZ()
    const today = getTodayInBusinessTZ()

    const filteredSlots = date === today
      ? availableSlots.filter(slot => {
          const [h, m] = slot.split(':').map(Number)
          const slotTime = new Date(now)
          slotTime.setHours(h, m, 0, 0)
          // Add configured hour buffer for preparation
          const bufferTime = new Date(now.getTime() + TIME_CONSTANTS.MIN_HOURS_BEFORE_PICKUP * 60 * 60 * 1000)
          return slotTime > bufferTime
        })
      : availableSlots

    return NextResponse.json({
      date,
      slots: filteredSlots,
      maxOrdersPerSlot
    })
  } catch (error) {
    console.error('Error in available slots API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
