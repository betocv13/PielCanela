-- Piel Canela Coffee - Pickup Dates System
-- Version: 1.3
-- Date: November 2025
--
-- This migration replaces the day-of-week based business_hours system
-- with a date-specific pickup_dates system for precise scheduling

-- =====================
-- NEW PICKUP DATES TABLE
-- =====================

-- Create pickup_dates table for specific date scheduling
CREATE TABLE IF NOT EXISTS pickup_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  open_time TIME NOT NULL DEFAULT '09:00',
  close_time TIME NOT NULL DEFAULT '17:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for efficient date lookups
CREATE INDEX IF NOT EXISTS idx_pickup_dates_date ON pickup_dates(date);

-- Add trigger for updated_at
CREATE TRIGGER update_pickup_dates_updated_at
  BEFORE UPDATE ON pickup_dates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- RLS POLICIES
-- =====================

-- Enable RLS
ALTER TABLE pickup_dates ENABLE ROW LEVEL SECURITY;

-- Public can view all pickup dates (needed for customer checkout)
CREATE POLICY "Public can view pickup dates" ON pickup_dates
  FOR SELECT USING (true);

-- Only authenticated users (admins) can insert pickup dates
CREATE POLICY "Admins can insert pickup dates" ON pickup_dates
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only authenticated users (admins) can update pickup dates
CREATE POLICY "Admins can update pickup dates" ON pickup_dates
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Only authenticated users (admins) can delete pickup dates
CREATE POLICY "Admins can delete pickup dates" ON pickup_dates
  FOR DELETE USING (auth.role() = 'authenticated');

-- =====================
-- NOTES
-- =====================
--
-- The old business_hours table is kept for backwards compatibility
-- but the available-slots API will now use pickup_dates instead.
--
-- To migrate existing weekly schedules, admins should manually
-- add specific dates through the new admin interface.
