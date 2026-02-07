-- Migration: Extend profiles table with employee-related fields
-- This adds new columns to the existing profiles table

-- ============================================
-- Add new columns to profiles table
-- ============================================

-- Add middle_name column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS middle_name TEXT NULL;

-- Add phone_number column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20) NULL;

-- Add user_type_id foreign key column
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_type_id INTEGER NULL;

-- Add must_change_password column (for first-time login requirement)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true;

-- ============================================
-- Add Foreign Key Constraint
-- ============================================

-- Add FK constraint to user_type table
ALTER TABLE public.profiles
ADD CONSTRAINT profiles_user_type_id_fkey
FOREIGN KEY (user_type_id) REFERENCES public.user_type(user_type_id)
ON DELETE SET NULL;

-- ============================================
-- Create Index for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_user_type_id ON public.profiles(user_type_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ============================================
-- Update existing trigger to handle new fields
-- ============================================

-- Drop and recreate the trigger function to handle new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    first_name,
    middle_name,
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
    NEW.raw_user_meta_data->>'middle_name',
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
