-- Migration: Add company_name to profiles table
-- This allows storing an associated company directly on the user profile

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
