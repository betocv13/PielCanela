-- Migration: Remove category CHECK constraint
-- Date: November 2025
-- Purpose: Allow custom categories beyond 'coffee', 'matcha', 'other'

-- Drop the existing CHECK constraint on the category column
-- This allows users to create products with custom categories
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
