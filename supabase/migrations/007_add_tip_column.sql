-- Migration 007: Add tip column to orders table
-- Stores the tip amount chosen by the customer at checkout.
-- Nullable-safe: defaults to 0 so existing orders are unaffected.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS tip NUMERIC NOT NULL DEFAULT 0;
