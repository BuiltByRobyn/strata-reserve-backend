-- Migration: Create strata-related tables

-- ============================================
-- STRATA Table (Main property table)
-- ============================================
CREATE TABLE IF NOT EXISTS public.strata (
  strata_id SERIAL PRIMARY KEY,
  strata_plan VARCHAR(100) NULL,
  complex_name VARCHAR(255) NULL,
  unit_number VARCHAR(50) NULL,
  street_name VARCHAR(255) NULL,
  town VARCHAR(100) NULL,
  province VARCHAR(100) NULL,
  postal_code VARCHAR(20) NULL,
  country VARCHAR(100) DEFAULT 'Canada',
  website VARCHAR(255) NULL,
  legal_type_id INTEGER NULL,
  property_type_id INTEGER NULL,
  company_id INTEGER NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign Key Constraints
  CONSTRAINT strata_legal_type_id_fkey 
    FOREIGN KEY (legal_type_id) REFERENCES public.legal_type(legal_type_id) ON DELETE SET NULL,
  CONSTRAINT strata_property_type_id_fkey 
    FOREIGN KEY (property_type_id) REFERENCES public.property_type(property_type_id) ON DELETE SET NULL,
  CONSTRAINT strata_company_id_fkey 
    FOREIGN KEY (company_id) REFERENCES public.company(company_id) ON DELETE SET NULL
);

-- ============================================
-- STRATA_NOTE Table (Notes attached to strata)
-- ============================================
CREATE TABLE IF NOT EXISTS public.strata_note (
  note_id SERIAL PRIMARY KEY,
  note_message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by_user VARCHAR(255) NULL,
  strata_id INTEGER NOT NULL,
  created_by_profile_id UUID NULL,
  
  -- Foreign Key Constraints
  CONSTRAINT strata_note_strata_id_fkey 
    FOREIGN KEY (strata_id) REFERENCES public.strata(strata_id) ON DELETE CASCADE,
  CONSTRAINT strata_note_created_by_profile_id_fkey 
    FOREIGN KEY (created_by_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- ============================================
-- STRATA_EMPLOYEE Table (Junction: profiles <-> strata with positions)
-- ============================================
CREATE TABLE IF NOT EXISTS public.strata_employee (
  strata_employee_id SERIAL PRIMARY KEY,
  strata_position VARCHAR(100) NULL,
  strata_id INTEGER NOT NULL,
  profile_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign Key Constraints
  CONSTRAINT strata_employee_strata_id_fkey 
    FOREIGN KEY (strata_id) REFERENCES public.strata(strata_id) ON DELETE CASCADE,
  CONSTRAINT strata_employee_profile_id_fkey 
    FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Unique constraint to prevent duplicate assignments
  CONSTRAINT strata_employee_unique UNIQUE (strata_id, profile_id)
);

-- ============================================
-- STRATA_SERVICE Table (Junction: strata <-> service)
-- ============================================
CREATE TABLE IF NOT EXISTS public.strata_service (
  strata_service_id SERIAL PRIMARY KEY,
  strata_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Foreign Key Constraints
  CONSTRAINT strata_service_strata_id_fkey 
    FOREIGN KEY (strata_id) REFERENCES public.strata(strata_id) ON DELETE CASCADE,
  CONSTRAINT strata_service_service_id_fkey 
    FOREIGN KEY (service_id) REFERENCES public.service(service_id) ON DELETE CASCADE,
  
  -- Unique constraint to prevent duplicate service assignments
  CONSTRAINT strata_service_unique UNIQUE (strata_id, service_id)
);

-- ============================================
-- Create Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_strata_company_id ON public.strata(company_id);
CREATE INDEX IF NOT EXISTS idx_strata_legal_type_id ON public.strata(legal_type_id);
CREATE INDEX IF NOT EXISTS idx_strata_property_type_id ON public.strata(property_type_id);
CREATE INDEX IF NOT EXISTS idx_strata_strata_plan ON public.strata(strata_plan);

CREATE INDEX IF NOT EXISTS idx_strata_note_strata_id ON public.strata_note(strata_id);
CREATE INDEX IF NOT EXISTS idx_strata_note_created_by_profile_id ON public.strata_note(created_by_profile_id);

CREATE INDEX IF NOT EXISTS idx_strata_employee_strata_id ON public.strata_employee(strata_id);
CREATE INDEX IF NOT EXISTS idx_strata_employee_profile_id ON public.strata_employee(profile_id);

CREATE INDEX IF NOT EXISTS idx_strata_service_strata_id ON public.strata_service(strata_id);
CREATE INDEX IF NOT EXISTS idx_strata_service_service_id ON public.strata_service(service_id);

-- ============================================
-- Updated_at Triggers
-- ============================================
CREATE TRIGGER update_strata_updated_at
  BEFORE UPDATE ON public.strata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- STRATA table RLS
ALTER TABLE public.strata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read strata"
  ON public.strata FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage strata"
  ON public.strata FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- STRATA_NOTE table RLS
ALTER TABLE public.strata_note ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read strata_note"
  ON public.strata_note FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create notes for their assigned strata"
  ON public.strata_note FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by_profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Users can update their own notes"
  ON public.strata_note FOR UPDATE
  TO authenticated
  USING (
    created_by_profile_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete notes"
  ON public.strata_note FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- STRATA_EMPLOYEE table RLS
ALTER TABLE public.strata_employee ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read strata_employee"
  ON public.strata_employee FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage strata_employee"
  ON public.strata_employee FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- STRATA_SERVICE table RLS
ALTER TABLE public.strata_service ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read strata_service"
  ON public.strata_service FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage strata_service"
  ON public.strata_service FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  );
