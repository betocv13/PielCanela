-- Piel Canela Coffee - Initial Database Schema
-- Version: 1.0
-- Date: November 2025

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- PRODUCTS TABLE
-- =====================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('coffee', 'matcha', 'other')),
  base_price DECIMAL(10, 2) NOT NULL,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  deleted BOOLEAN DEFAULT false,

  -- Size options (JSON array)
  sizes JSONB DEFAULT '[]'::jsonb,

  -- Milk options (JSON array)
  milk_options JSONB DEFAULT '[]'::jsonb,

  -- Add-ons (JSON array)
  addons JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_available ON products(available) WHERE NOT deleted;

-- =====================
-- ORDERS TABLE
-- =====================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,

  -- Customer info
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,

  -- Order items (JSON array)
  items JSONB NOT NULL,

  -- Pricing
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,

  -- Payment
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'venmo', 'cashapp')),
  payment_confirmed BOOLEAN DEFAULT false,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'completed')),

  -- Pickup
  pickup_date DATE NOT NULL,
  pickup_time TIME NOT NULL,

  -- Special instructions
  special_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_pickup ON orders(pickup_date, pickup_time);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_payment ON orders(payment_confirmed);

-- =====================
-- BUSINESS HOURS TABLE
-- =====================
CREATE TABLE business_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_open BOOLEAN DEFAULT true,
  open_time TIME NOT NULL,
  close_time TIME NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(day_of_week)
);

-- Seed default hours (Wed-Sat, 10 AM - 6 PM)
INSERT INTO business_hours (day_of_week, is_open, open_time, close_time) VALUES
  (0, false, '10:00', '18:00'),  -- Sunday (closed)
  (1, false, '10:00', '18:00'),  -- Monday (closed)
  (2, false, '10:00', '18:00'),  -- Tuesday (closed)
  (3, true, '10:00', '18:00'),   -- Wednesday
  (4, true, '10:00', '18:00'),   -- Thursday
  (5, true, '10:00', '18:00'),   -- Friday
  (6, true, '10:00', '18:00');   -- Saturday

-- =====================
-- SETTINGS TABLE
-- =====================
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed initial settings
INSERT INTO settings (key, value) VALUES
  ('ordering_enabled', 'true'),
  ('ordering_closed_message', '"Sorry, we''re not taking orders right now. Check back soon!"'),
  ('venmo_username', '"@pielcanela"'),
  ('cashapp_username', '"$pielcanela"'),
  ('owner_email', '"pielcanelacoffee@gmail.com"'),
  ('notification_frequency', '"instant"');

-- =====================
-- DATABASE FUNCTIONS
-- =====================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_hours_updated_at
  BEFORE UPDATE ON business_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  counter INTEGER := 1;
BEGIN
  LOOP
    new_number := 'PC' || LPAD(counter::TEXT, 4, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_number);
    counter := counter + 1;
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Auto-delete old completed orders (to be called by cron job)
CREATE OR REPLACE FUNCTION delete_old_completed_orders()
RETURNS void AS $$
BEGIN
  DELETE FROM orders
  WHERE status = 'completed'
    AND completed_at < NOW() - INTERVAL '5 days';
END;
$$ LANGUAGE plpgsql;

-- =====================
-- ROW LEVEL SECURITY
-- =====================

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Products policies
CREATE POLICY "Public can view available products" ON products
  FOR SELECT USING (available = true AND deleted = false);

CREATE POLICY "Authenticated users can manage products" ON products
  FOR ALL USING (auth.role() = 'authenticated');

-- Orders policies
CREATE POLICY "Public can create orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can manage orders" ON orders
  FOR ALL USING (auth.role() = 'authenticated');

-- Business hours policies
CREATE POLICY "Public can view business hours" ON business_hours
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage business hours" ON business_hours
  FOR ALL USING (auth.role() = 'authenticated');

-- Settings policies
CREATE POLICY "Public can view certain settings" ON settings
  FOR SELECT USING (key IN ('ordering_enabled', 'ordering_closed_message', 'venmo_username', 'cashapp_username'));

CREATE POLICY "Authenticated users can manage settings" ON settings
  FOR ALL USING (auth.role() = 'authenticated');
