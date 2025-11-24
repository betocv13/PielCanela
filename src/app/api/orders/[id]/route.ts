import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ORDER_STATUS } from '@/lib/constants'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// PATCH - Update order status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // First check authentication with regular client
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    // Validate status
    const validStatuses = Object.values(ORDER_STATUS)
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // Prepare update object
    const updates: { status: string; completed_at?: string | null } = { status }
    if (status === 'completed') {
      updates.completed_at = new Date().toISOString()
    } else {
      updates.completed_at = null
    }

    // Use admin client to bypass RLS
    const adminClient = createAdminClient()
    const { data: order, error: updateError } = await adminClient
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating order:', updateError)
      return NextResponse.json(
        { error: 'Failed to update order' },
        { status: 500 }
      )
    }

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ order })
  } catch (error) {
    console.error('Error in update order API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
