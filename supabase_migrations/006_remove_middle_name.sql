-- Migration: Remove middle_name column from profiles table
-- This is a breaking change - existing data in middle_name will be lost

-- ============================================
-- Drop middle_name column from profiles table
-- ============================================
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS middle_name;

-- ============================================
-- Update handle_new_user trigger function to remove middle_name
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    first_name,
    last_name,
    display_name,
    email,
    is_admin,
    must_change_password,
    created_at
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'display_name',
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, false),
    COALESCE((NEW.raw_user_meta_data->>'must_change_password')::boolean, true),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
