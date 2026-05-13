-- Migration 005: Add Stripe as a valid payment method
-- Expands the payment_method CHECK constraint to include 'stripe'.
-- 'venmo' and 'cashapp' are intentionally kept in the constraint
-- to preserve validity of all existing production order rows.
-- No rows are deleted or modified by this migration.

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('cash', 'venmo', 'cashapp', 'stripe'));

-- Add column to store Stripe PaymentIntent ID for webhook lookup
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
