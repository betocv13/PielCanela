import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET - Fetch all business hours
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: hours, error } = await supabase
      .from('business_hours')
      .select('*')
      .order('day_of_week')

    if (error) {
      console.error('Error fetching business hours:', error)
      return NextResponse.json(
        { error: 'Failed to fetch business hours' },
        { status: 500 }
      )
    }

    return NextResponse.json({ hours })
  } catch (error) {
    console.error('Error in business hours API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update all business hours
export async function PUT(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { hours } = body

    if (!Array.isArray(hours) || hours.length !== 7) {
      return NextResponse.json(
        { error: 'Invalid hours data - must provide all 7 days' },
        { status: 400 }
      )
    }

    // Validate each day's data
    for (const day of hours) {
      if (
        typeof day.day_of_week !== 'number' ||
        day.day_of_week < 0 ||
        day.day_of_week > 6 ||
        typeof day.is_open !== 'boolean' ||
        !day.open_time ||
        !day.close_time
      ) {
        return NextResponse.json(
          { error: 'Invalid hours data format' },
          { status: 400 }
        )
      }
    }

    // Update each day's hours
    const updatePromises = hours.map((day: {
      day_of_week: number
      is_open: boolean
      open_time: string
      close_time: string
    }) =>
      supabase
        .from('business_hours')
        .update({
          is_open: day.is_open,
          open_time: day.open_time,
          close_time: day.close_time,
        })
        .eq('day_of_week', day.day_of_week)
    )

    const results = await Promise.all(updatePromises)

    // Check for any errors
    const errors = results.filter(r => r.error)
    if (errors.length > 0) {
      console.error('Error updating business hours:', errors)
      return NextResponse.json(
        { error: 'Failed to update some hours' },
        { status: 500 }
      )
    }

    // Fetch updated hours
    const { data: updatedHours, error: fetchError } = await supabase
      .from('business_hours')
      .select('*')
      .order('day_of_week')

    if (fetchError) {
      console.error('Error fetching updated hours:', fetchError)
      return NextResponse.json(
        { error: 'Hours updated but failed to fetch' },
        { status: 500 }
      )
    }

    return NextResponse.json({ hours: updatedHours })
  } catch (error) {
    console.error('Error in update business hours API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
