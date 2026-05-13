import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const body = await request.json()
  const { orderId, amount } = body

  if (!orderId || amount === undefined || amount === null) {
    return NextResponse.json(
      { error: 'orderId and amount are required' },
      { status: 400 }
    )
  }

  if (typeof amount !== 'number' || !Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json(
      { error: 'amount must be a positive integer (cents)' },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, total')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    )
  }

  const expectedAmount = Math.round(order.total * 100)
  if (amount !== expectedAmount) {
    return NextResponse.json(
      { error: 'Amount does not match order total' },
      { status: 400 }
    )
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    metadata: { orderId },
  })

  const { error: updateError } = await supabase
    .from('orders')
    .update({ stripe_payment_intent_id: paymentIntent.id })
    .eq('id', orderId)

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to store payment intent on order' },
      { status: 500 }
    )
  }

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
