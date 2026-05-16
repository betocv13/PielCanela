import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { CreateOrderPayload } from '@/types'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// GET - Fetch orders (admin only)
export async function GET(request: Request) {
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
    const status = searchParams.get('status')
    const date = searchParams.get('date')

    let query = supabase
      .from('orders')
      .select('*')
      .order('pickup_date', { ascending: true })
      .order('pickup_time', { ascending: true })

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (date) {
      query = query.eq('pickup_date', date)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch orders' },
        { status: 500 }
      )
    }

    return NextResponse.json({ orders, count: orders.length })
  } catch (error) {
    console.error('Error in orders API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new order
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body: CreateOrderPayload = await request.json()

    // Validate required fields
    if (!body.customer_name || !body.customer_phone || !body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!body.pickup_date || !body.pickup_time) {
      return NextResponse.json(
        { error: 'Pickup date and time are required' },
        { status: 400 }
      )
    }

    // Fetch settings for order limit check and global milk prices
    const { data: settingsData, error: settingsError } = await supabase
      .from('settings')
      .select('key, value')

    if (settingsError) {
      console.error('Error fetching settings:', settingsError)
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }

    // Parse settings
    const settings: Record<string, unknown> = {}
    for (const setting of settingsData || []) {
      settings[setting.key] = setting.value
    }

    const maxOrdersPerSlot = Number(settings.max_orders_per_slot) || 2
    const defaultTaxRate = Number(settings.default_tax_rate) || 0

    // Check if ordering is enabled
    const orderingEnabled = settings.ordering_enabled === true || settings.ordering_enabled === 'true'
    if (!orderingEnabled) {
      return NextResponse.json(
        { error: 'Ordering is currently closed' },
        { status: 400 }
      )
    }

    // Check order limit for the time slot (count all orders including completed)
    const { count: existingOrders, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('pickup_date', body.pickup_date)
      .eq('pickup_time', body.pickup_time)
      .neq('status', 'cancelled')

    if (countError) {
      console.error('Error checking order count:', countError)
      return NextResponse.json(
        { error: 'Failed to check order availability' },
        { status: 500 }
      )
    }

    if ((existingOrders || 0) >= maxOrdersPerSlot) {
      return NextResponse.json(
        { error: `This time slot is full. Maximum ${maxOrdersPerSlot} orders per slot.` },
        { status: 400 }
      )
    }

    // Fetch products for tax rate calculation
    const productIds = body.items.map(item => item.productId)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, tax_rate')
      .in('id', productIds)

    if (productsError) {
      console.error('Error fetching products:', productsError)
    }

    // Create product tax rate map
    const productTaxRates: Record<string, number | null> = {}
    for (const product of products || []) {
      productTaxRates[product.id] = product.tax_rate
    }

    // Recalculate item totals with global milk prices
    let subtotal = 0
    const updatedItems = body.items.map(item => {
      // Note: The itemTotal from frontend should already be calculated
      // We trust it but could recalculate here if needed
      subtotal += item.itemTotal
      return item
    })

    // Calculate tax based on product-specific rates or default
    let tax = 0
    for (const item of updatedItems) {
      const productTaxRate = productTaxRates[item.productId]
      const taxRate = productTaxRate !== null && productTaxRate !== undefined
        ? productTaxRate
        : defaultTaxRate
      tax += (item.itemTotal * taxRate) / 100
    }

    // Round tax to 2 decimal places
    tax = Math.round(tax * 100) / 100
    const total = subtotal + tax

    // Generate order number using the database function
    const { data: orderNumberData, error: orderNumberError } = await supabase
      .rpc('generate_order_number')

    if (orderNumberError) {
      console.error('Error generating order number:', orderNumberError)
      return NextResponse.json(
        { error: 'Failed to generate order number' },
        { status: 500 }
      )
    }

    const orderNumber = orderNumberData as string

    // Create the order
    const { data: order, error: createError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        customer_email: body.customer_email || null,
        items: updatedItems,
        subtotal,
        tax,
        total,
        payment_method: body.payment_method,
        pickup_date: body.pickup_date,
        pickup_time: body.pickup_time,
        special_notes: body.special_notes || null,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating order:', createError)
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      )
    }

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('Error in create order API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Clean up a failed Stripe order
// Only deletes unconfirmed Stripe orders created within the last 10 minutes.
// This is called client-side after a card decline to remove the orphan order row.
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('id')

  if (!orderId) {
    return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()

  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId)
    .eq('payment_method', 'stripe')
    .eq('payment_confirmed', false)
    .gte('created_at', tenMinutesAgo)

  if (error) {
    console.error('Error deleting failed Stripe order:', error)
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
