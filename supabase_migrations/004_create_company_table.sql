-- Migration: Create company table

-- ============================================
-- COMPANY Table
-- ============================================
CREATE TABLE IF NOT EXISTS public.company (
  company_id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  company_telephone VARCHAR(20) NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Create Index for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_company_name ON public.company(company_name);

-- ============================================
-- Updated_at Trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_company_updated_at
  BEFORE UPDATE ON public.company
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================
ALTER TABLE public.company ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read companies
CREATE POLICY "Authenticated users can read company"
  ON public.company FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can create/update/delete companies
CREATE POLICY "Admins can manage company"
  ON public.company FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
