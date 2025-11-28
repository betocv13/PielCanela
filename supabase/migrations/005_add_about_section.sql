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

-- =====================
-- ABOUT_SECTION TABLE (for header and subtitle)
-- =====================
CREATE TABLE about_section (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  heading TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  active BOOLEAN DEFAULT true,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trigger for updated_at
CREATE TRIGGER update_about_section_updated_at
  BEFORE UPDATE ON about_section
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed initial data for about section header
INSERT INTO about_section (heading, subtitle) VALUES
  ('HECHO CON AMOR', 'Cafe y Matcha, pero con un toque Mexicano. 100% confident you''ll love every single one!');

-- Seed initial about items (4 items with placeholders)
INSERT INTO about_items (title, description, image_url, display_order) VALUES
  ('Made with love', 'Tasty Authentic Coffee, made with real ingredients', '/images/about-1.jpg', 1),
  ('Made with love', 'Fresh matcha sourced from the finest farms', '/images/about-2.jpg', 2),
  ('Made with love', 'Handcrafted with care at every step', '/images/about-3.jpg', 3),
  ('Made with love', 'Authentic flavors that bring joy', '/images/about-4.jpg', 4);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

-- Enable RLS
ALTER TABLE about_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE about_section ENABLE ROW LEVEL SECURITY;

-- About items policies
CREATE POLICY "Public can view active about items" ON about_items
  FOR SELECT USING (active = true);

CREATE POLICY "Authenticated users can manage about items" ON about_items
  FOR ALL USING (auth.role() = 'authenticated');

-- About section policies
CREATE POLICY "Public can view active about section" ON about_section
  FOR SELECT USING (active = true);

CREATE POLICY "Authenticated users can manage about section" ON about_section
  FOR ALL USING (auth.role() = 'authenticated');
