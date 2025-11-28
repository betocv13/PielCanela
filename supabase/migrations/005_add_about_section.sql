-- About Section Items Table
-- Version: 1.0
-- Date: November 2025

-- =====================
-- ABOUT_ITEMS TABLE
-- =====================
CREATE TABLE about_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_about_items_display_order ON about_items(display_order);
CREATE INDEX idx_about_items_active ON about_items(active);

-- Create trigger for updated_at
CREATE TRIGGER update_about_items_updated_at
  BEFORE UPDATE ON about_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed initial about items (4 items with placeholders)
-- Update these image URLs with your actual Supabase Storage URLs
INSERT INTO about_items (title, description, image_url, display_order) VALUES
  ('Made with love', 'Tasty Authentic Coffee, made with real ingredients', 'https://eobgaersvyjrbvykqqug.supabase.co/storage/v1/object/public/About/IMG_3671.jpg', 1),
  ('Made with love', 'Fresh matcha sourced from the finest farms', 'https://eobgaersvyjrbvykqqug.supabase.co/storage/v1/object/public/About/IMG_3672.jpg', 2),
  ('Made with love', 'Handcrafted with care at every step', 'https://eobgaersvyjrbvykqqug.supabase.co/storage/v1/object/public/About/IMG_3673.jpg', 3),
  ('Made with love', 'Authentic flavors that bring joy', 'https://eobgaersvyjrbvykqqug.supabase.co/storage/v1/object/public/About/IMG_3674.jpg', 4);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

-- Enable RLS
ALTER TABLE about_items ENABLE ROW LEVEL SECURITY;

-- About items policies
CREATE POLICY "Public can view active about items" ON about_items
  FOR SELECT USING (active = true);

CREATE POLICY "Authenticated users can manage about items" ON about_items
  FOR ALL USING (auth.role() = 'authenticated');
