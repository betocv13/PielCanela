import { loadStripe } from '@stripe/stripe-js'

// loadStripe is called once and the Promise is cached.
// Importing this file multiple times always returns the same Promise,
// which means the Stripe.js script is only ever loaded once.
export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)
