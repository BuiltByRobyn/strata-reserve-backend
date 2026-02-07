-- ============================================
-- Migration: Add Inspector Available Date and Company Holiday Tables
-- Date: 2026-02-07
-- ============================================

-- Create inspector_available_date table
CREATE TABLE IF NOT EXISTS inspector_available_date (
  inspector_available_date_id SERIAL PRIMARY KEY,
  available_date DATE NOT NULL,
  available_start_time TIME,
  available_end_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  inspector_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE
);

-- Create index on inspector_profile_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_inspector_available_date_profile 
  ON inspector_available_date(inspector_profile_id);

-- Create index on available_date for date range queries
CREATE INDEX IF NOT EXISTS idx_inspector_available_date_date 
  ON inspector_available_date(available_date);

-- Create company_holiday table  
CREATE TABLE IF NOT EXISTS company_holiday (
  company_holiday_id SERIAL PRIMARY KEY,
  holiday_date DATE NOT NULL,
  holiday_name VARCHAR(100) NOT NULL,
  is_recurring_annually BOOLEAN DEFAULT FALSE NOT NULL
);

-- Create index on holiday_date for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_holiday_date 
  ON company_holiday(holiday_date);

-- ============================================
-- Seed Data: Company Holidays
-- ============================================

INSERT INTO company_holiday (holiday_date, holiday_name, is_recurring_annually) VALUES
  ('2026-12-25', 'Christmas', true),
  ('2026-07-01', 'Canada Day', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- Seed Data: Appointment Types
-- (Only inserts if they don't already exist)
-- ============================================

-- Insert Standard Inspection if not exists
INSERT INTO appointment_type (type_name, duration_type, description, is_draft_meeting, service_id)
SELECT 'Standard Inspection', 'Half Day', 'Standard property inspection', false, s.service_id
FROM service s 
WHERE s.service_name = 'Reserve Fund Study'
  AND NOT EXISTS (
    SELECT 1 FROM appointment_type WHERE type_name = 'Standard Inspection'
  )
LIMIT 1;

-- Insert Elevator Assessment if not exists
INSERT INTO appointment_type (type_name, duration_type, description, is_draft_meeting, service_id)
SELECT 'Elevator Assessment', 'Full Day', 'Full elevator assessment inspection', false, s.service_id
FROM service s 
WHERE s.service_name = 'Reserve Fund Study'
  AND NOT EXISTS (
    SELECT 1 FROM appointment_type WHERE type_name = 'Elevator Assessment'
  )
LIMIT 1;

-- ============================================
-- Enable Row Level Security (Optional - matches existing pattern)
-- ============================================

-- ALTER TABLE inspector_available_date ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE company_holiday ENABLE ROW LEVEL SECURITY;
