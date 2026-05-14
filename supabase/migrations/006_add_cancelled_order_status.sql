-- Migration 006: Document 'cancelled' status (already exists in production DB)
-- This migration is a no-op on production — the constraint already includes 'cancelled'.
-- It exists to keep migration files in sync with the live schema.
-- Safe to run multiple times due to DROP/ADD pattern.

ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'ready', 'completed', 'cancelled'));
