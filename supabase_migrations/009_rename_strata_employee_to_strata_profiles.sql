-- Migration: Create strata_profiles table  
-- This creates the junction table between profiles and strata
-- Use this if strata_employee doesn't exist or if you need to create from scratch

-- First, check and drop the old table if it exists, then create new one
DROP TABLE IF EXISTS public.strata_profiles CASCADE;

CREATE TABLE IF NOT EXISTS public.strata_profiles (
  strata_profile_id SERIAL PRIMARY KEY,
  strata_position VARCHAR(100) NULL,
  strata_id INTEGER NOT NULL,
  profile_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign Key Constraints
  CONSTRAINT strata_profiles_strata_id_fkey 
    FOREIGN KEY (strata_id) REFERENCES public.strata(strata_id) ON DELETE CASCADE,
  CONSTRAINT strata_profiles_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Unique constraint to prevent duplicate assignments
  CONSTRAINT strata_profiles_unique UNIQUE (strata_id, profile_id)
);

-- Create Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_strata_profiles_strata_id ON public.strata_profiles(strata_id);
CREATE INDEX IF NOT EXISTS idx_strata_profiles_profile_id ON public.strata_profiles(profile_id);

-- Row Level Security (RLS) Policies
ALTER TABLE public.strata_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read strata_profiles"
  ON public.strata_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage strata_profiles"
  ON public.strata_profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
