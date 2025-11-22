-- Piel Canela Coffee - Pricing, Tax, Order Limits & QR Codes
-- Version: 1.2
-- Date: November 2025

-- =====================
-- PRODUCTS TABLE UPDATE
-- =====================

-- Add optional per-product tax rate
ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5, 2) DEFAULT NULL;

-- =====================
-- NEW SETTINGS
-- =====================

-- Global milk options with prices (overrides per-product milk prices)
INSERT INTO settings (key, value) VALUES
  ('global_milk_options', '[
    {"name": "Whole Milk", "priceAdjustment": 0},
    {"name": "Oat Milk", "priceAdjustment": 0.50},
    {"name": "Almond Milk", "priceAdjustment": 0},
    {"name": "Coconut Milk", "priceAdjustment": 0}
  ]')
ON CONFLICT (key) DO NOTHING;

-- Default tax rate (percentage, e.g., 8.25 = 8.25%)
INSERT INTO settings (key, value) VALUES
  ('default_tax_rate', '0')
ON CONFLICT (key) DO NOTHING;

-- Maximum orders per 15-minute time slot
INSERT INTO settings (key, value) VALUES
  ('max_orders_per_slot', '2')
ON CONFLICT (key) DO NOTHING;

-- QR code image URLs (stored in Supabase storage)
INSERT INTO settings (key, value) VALUES
  ('venmo_qr_url', '""'),
  ('cashapp_qr_url', '""')
ON CONFLICT (key) DO NOTHING;

-- =====================
-- UPDATE ORDER NUMBER GENERATION
-- =====================

-- Replace the sequential order number function with random 4-digit generator
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  random_num INTEGER;
  max_attempts INTEGER := 100;
  attempt INTEGER := 0;
BEGIN
  LOOP
    -- Generate random 4-digit number (1000-9999)
    random_num := floor(random() * 9000 + 1000)::INTEGER;
    new_number := random_num::TEXT;

    -- Check if this number already exists in active orders (not completed)
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM orders
      WHERE order_number = new_number
      AND status != 'completed'
    );

    attempt := attempt + 1;
    IF attempt >= max_attempts THEN
      -- Fallback: add timestamp suffix to guarantee uniqueness
      new_number := random_num::TEXT || '-' || extract(epoch from now())::INTEGER % 1000;
      EXIT;
    END IF;
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- =====================
-- UPDATE RLS POLICIES
-- =====================

-- Drop existing settings select policy
DROP POLICY IF EXISTS "Public can view certain settings" ON settings;

-- Recreate with additional public settings (QR URLs)
CREATE POLICY "Public can view certain settings" ON settings
  FOR SELECT USING (key IN (
    'ordering_enabled',
    'ordering_closed_message',
    'venmo_username',
    'cashapp_username',
    'venmo_qr_url',
    'cashapp_qr_url',
    'global_milk_options',
    'default_tax_rate',
    'max_orders_per_slot'
  ));

-- =====================
-- STORAGE BUCKET FOR QR CODES
-- =====================

-- Note: Storage bucket creation should be done via Supabase dashboard or API
-- The bucket name should be: payment-qr-codes
-- Public access should be enabled for this bucket

-- To create via SQL (requires supabase_admin role):
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('payment-qr-codes', 'payment-qr-codes', true)
-- ON CONFLICT (id) DO NOTHING;
