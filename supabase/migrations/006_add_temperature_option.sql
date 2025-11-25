-- Add has_temperature column to products table
-- This allows products to enable hot/cold temperature selection

ALTER TABLE products
ADD COLUMN IF NOT EXISTS has_temperature BOOLEAN DEFAULT false;

-- Update existing products to have has_temperature = false
UPDATE products SET has_temperature = false WHERE has_temperature IS NULL;

COMMENT ON COLUMN products.has_temperature IS 'Enable hot/cold temperature selection for this product';
