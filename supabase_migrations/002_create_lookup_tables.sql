-- Migration: Create lookup/reference tables
-- These tables contain predefined values that other tables reference

-- ============================================
-- USER_TYPE Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_type (
  user_type_id SERIAL PRIMARY KEY,
  user_type_name VARCHAR(50) NOT NULL UNIQUE
);

-- Seed user types
INSERT INTO public.user_type (user_type_name) VALUES
  ('administrator'),
  ('inspector'),
  ('client'),
  ('assistant')
ON CONFLICT (user_type_name) DO NOTHING;

-- ============================================
-- LEGAL_TYPE Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.legal_type (
  legal_type_id SERIAL PRIMARY KEY,
  legal_type_name VARCHAR(50) NOT NULL UNIQUE
);

-- Seed legal types
INSERT INTO public.legal_type (legal_type_name) VALUES
  ('Standalone'),
  ('Air-Parcel')
ON CONFLICT (legal_type_name) DO NOTHING;

-- ============================================
-- PROPERTY_TYPE Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.property_type (
  property_type_id SERIAL PRIMARY KEY,
  property_type_name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT NULL -- Only used when property_type_name is 'other'
);

-- Seed property types
INSERT INTO public.property_type (property_type_name, description) VALUES
  ('Bare Land', NULL),
  ('Townhome', NULL),
  ('Apartment', NULL),
  ('Other', NULL)
ON CONFLICT (property_type_name) DO NOTHING;

-- ============================================
-- SERVICE Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.service (
  service_id SERIAL PRIMARY KEY,
  service_name VARCHAR(100) NOT NULL UNIQUE,
  service_description TEXT NULL
);

-- Seed services
INSERT INTO public.service (service_name, service_description) VALUES
  ('Electrical planning report referral', 'Referral service for electrical planning reports and assessments'),
  ('Insurance appraisal', 'Professional insurance appraisal services for strata properties'),
  ('Elevator depreciation report', 'Specialized depreciation reports for elevator systems'),
  ('Standard depreciation report', 'Comprehensive depreciation reports for strata reserve planning')
ON CONFLICT (service_name) DO NOTHING;

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all lookup tables
ALTER TABLE public.user_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read lookup tables
CREATE POLICY "Authenticated users can read user_type"
  ON public.user_type FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read legal_type"
  ON public.legal_type FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read property_type"
  ON public.property_type FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can read service"
  ON public.service FOR SELECT
  TO authenticated
  USING (true);

-- Allow admins to modify lookup tables
CREATE POLICY "Admins can modify user_type"
  ON public.user_type FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can modify legal_type"
  ON public.legal_type FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can modify property_type"
  ON public.property_type FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can modify service"
  ON public.service FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
