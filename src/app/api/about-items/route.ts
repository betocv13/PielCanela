import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET - Fetch active about items ordered by display_order
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: items, error } = await supabase
      .from('about_items')
      .select('*')
      .eq('active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching about items:', error)
      return NextResponse.json(
        { error: 'Failed to fetch about items' },
        { status: 500 }
      )
    }

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error in about-items API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
