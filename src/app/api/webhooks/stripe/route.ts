import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const rawBody = Buffer.from(await request.arrayBuffer())
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed'
    return NextResponse.json(
      { error: message },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const orderId = paymentIntent.metadata?.orderId

      if (!orderId) {
        console.warn('payment_intent.succeeded received with no orderId in metadata', paymentIntent.id)
        return NextResponse.json({ received: true })
      }

      const { error } = await supabase
        .from('orders')
        .update({ payment_confirmed: true })
        .eq('id', orderId)

      if (error) {
        console.error('Failed to confirm payment for order', orderId, error)
      }

      return NextResponse.json({ received: true })
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const orderId = paymentIntent.metadata?.orderId
      const failureMessage = paymentIntent.last_payment_error?.message ?? 'Unknown failure reason'

      console.error('payment_intent.payment_failed', { orderId, failureMessage, paymentIntentId: paymentIntent.id })

      return NextResponse.json({ received: true })
    }

    default:
      return NextResponse.json({ received: true })
  }
}
