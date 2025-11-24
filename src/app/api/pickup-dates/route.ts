import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET - Fetch all pickup dates (future dates only by default)
export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const includeAll = searchParams.get('all') === 'true'

    let query = supabase
      .from('pickup_dates')
      .select('*')
      .order('date', { ascending: true })

    // By default, only return today and future dates
    if (!includeAll) {
      // Use local timezone for date comparison (consistent with available-slots API)
      const now = new Date()
      const todayYear = now.getFullYear()
      const todayMonth = String(now.getMonth() + 1).padStart(2, '0')
      const todayDay = String(now.getDate()).padStart(2, '0')
      const today = `${todayYear}-${todayMonth}-${todayDay}`
      query = query.gte('date', today)
    }

    const { data: dates, error } = await query

    if (error) {
      console.error('Error fetching pickup dates:', error.message, error.code, error.details)
      return NextResponse.json(
        { error: 'Failed to fetch pickup dates', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ dates: dates || [] })
  } catch (error) {
    console.error('Error in pickup dates API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// POST - Add a new pickup date
export async function POST(request: Request) {
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
    const { date, open_time, close_time } = body

    // Validate required fields
    if (!date || !open_time || !close_time) {
      return NextResponse.json(
        { error: 'Date, open_time, and close_time are required' },
        { status: 400 }
      )
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    // Validate time format (HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/
    if (!timeRegex.test(open_time) || !timeRegex.test(close_time)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM' },
        { status: 400 }
      )
    }

    // Check that close_time is after open_time
    if (close_time <= open_time) {
      return NextResponse.json(
        { error: 'Close time must be after open time' },
        { status: 400 }
      )
    }

    // Insert the new pickup date
    const { data: newDate, error: insertError } = await supabase
      .from('pickup_dates')
      .insert({
        date,
        open_time,
        close_time,
      })
      .select()
      .single()

    if (insertError) {
      // Check for unique constraint violation
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'A pickup date already exists for this date' },
          { status: 409 }
        )
      }
      console.error('Error inserting pickup date:', insertError.message, insertError.code, insertError.details)
      return NextResponse.json(
        { error: 'Failed to add pickup date', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ date: newDate }, { status: 201 })
  } catch (error) {
    console.error('Error in add pickup date API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// PUT - Update an existing pickup date
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
    const { id, open_time, close_time } = body

    // Validate required fields
    if (!id || !open_time || !close_time) {
      return NextResponse.json(
        { error: 'ID, open_time, and close_time are required' },
        { status: 400 }
      )
    }

    // Validate time format (HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/
    if (!timeRegex.test(open_time) || !timeRegex.test(close_time)) {
      return NextResponse.json(
        { error: 'Invalid time format. Use HH:MM' },
        { status: 400 }
      )
    }

    // Check that close_time is after open_time
    if (close_time <= open_time) {
      return NextResponse.json(
        { error: 'Close time must be after open time' },
        { status: 400 }
      )
    }

    // Update the pickup date
    const { data: updatedDate, error: updateError } = await supabase
      .from('pickup_dates')
      .update({
        open_time,
        close_time,
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating pickup date:', updateError)
      return NextResponse.json(
        { error: 'Failed to update pickup date' },
        { status: 500 }
      )
    }

    if (!updatedDate) {
      return NextResponse.json(
        { error: 'Pickup date not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ date: updatedDate })
  } catch (error) {
    console.error('Error in update pickup date API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a pickup date
export async function DELETE(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    // Delete the pickup date
    const { error: deleteError } = await supabase
      .from('pickup_dates')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting pickup date:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete pickup date' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in delete pickup date API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
