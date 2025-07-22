-- Database Migration: Add hero_image column to mint_pages table
-- Run this SQL command in your Supabase SQL Editor

-- Add hero_image column if it doesn't exist
ALTER TABLE mint_pages ADD COLUMN IF NOT EXISTS hero_image TEXT;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'mint_pages' 
  AND table_schema = 'public'
ORDER BY ordinal_position; 