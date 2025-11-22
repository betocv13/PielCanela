import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET - Fetch settings
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: settings, error } = await supabase
      .from('settings')
      .select('*')

    if (error) {
      console.error('Error fetching settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }

    // Convert to key-value object
    const settingsObj: Record<string, unknown> = {}
    for (const setting of settings) {
      settingsObj[setting.key] = setting.value
    }

    return NextResponse.json({ settings: settingsObj })
  } catch (error) {
    console.error('Error in settings API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH - Update a specific setting
export async function PATCH(request: Request) {
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
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      )
    }

    // Validate allowed keys for security
    const allowedKeys = [
      'ordering_enabled',
      'ordering_closed_message',
      'venmo_username',
      'cashapp_username',
      'owner_email',
      'notification_frequency'
    ]

    if (!allowedKeys.includes(key)) {
      return NextResponse.json(
        { error: 'Invalid setting key' },
        { status: 400 }
      )
    }

    // Update the setting
    const { data: setting, error } = await supabase
      .from('settings')
      .update({ value: JSON.stringify(value) })
      .eq('key', key)
      .select()
      .single()

    if (error) {
      console.error('Error updating setting:', error)
      return NextResponse.json(
        { error: 'Failed to update setting' },
        { status: 500 }
      )
    }

    return NextResponse.json({ setting })
  } catch (error) {
    console.error('Error in update setting API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
