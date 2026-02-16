-- ============================================
-- Cleanup Legal Types
-- Target: Standard, Bare Land, Air Parcel
-- ============================================

-- First, nullify any strata references to legal types we're about to delete
UPDATE strata
SET legal_type_id = NULL
WHERE legal_type_id IN (
  SELECT legal_type_id FROM legal_type
  WHERE legal_type_name NOT IN ('Standard', 'Bare Land', 'Air Parcel')
);

-- Nullify any question_legal_type references
DELETE FROM question_legal_type
WHERE legal_type_id IN (
  SELECT legal_type_id FROM legal_type
  WHERE legal_type_name NOT IN ('Standard', 'Bare Land', 'Air Parcel')
);

-- Delete legal types not in the approved list
DELETE FROM legal_type
WHERE legal_type_name NOT IN ('Standard', 'Bare Land', 'Air Parcel');

-- Ensure all 3 legal types exist (insert if missing)
INSERT INTO legal_type (legal_type_name)
VALUES ('Standard'), ('Bare Land'), ('Air Parcel')
ON CONFLICT (legal_type_name) DO NOTHING;

-- ============================================
-- Cleanup Property Types
-- Target (in order):
--   1. Bare Land
--   2. Bare Land with Septic
--   3. Bare Land with Clubhouse
--   4. Townhomes
--   5. Townhomes with Septic
--   6. Townhomes with Clubhouse
--   7. Apartments
--   8. Apartments with Clubhouse
--   9. Mixed-Use: Apt over Retail
--  10. Mixed-Use: Commercial
--  11. Industrial
--  12. Air Parcel
--  13. Other
-- ============================================

-- First, nullify strata references to property types we're about to delete
UPDATE strata
SET property_type_id = NULL
WHERE property_type_id IN (
  SELECT property_type_id FROM property_type
  WHERE property_type_name NOT IN (
    'Bare Land',
    'Bare Land with Septic',
    'Bare Land with Clubhouse',
    'Townhomes',
    'Townhomes with Septic',
    'Townhomes with Clubhouse',
    'Apartments',
    'Apartments with Clubhouse',
    'Mixed-Use: Apt over Retail',
    'Mixed-Use: Commercial',
    'Industrial',
    'Air Parcel',
    'Other'
  )
);

-- Clean up question_property_type references
DELETE FROM question_property_type
WHERE property_type_id IN (
  SELECT property_type_id FROM property_type
  WHERE property_type_name NOT IN (
    'Bare Land',
    'Bare Land with Septic',
    'Bare Land with Clubhouse',
    'Townhomes',
    'Townhomes with Septic',
    'Townhomes with Clubhouse',
    'Apartments',
    'Apartments with Clubhouse',
    'Mixed-Use: Apt over Retail',
    'Mixed-Use: Commercial',
    'Industrial',
    'Air Parcel',
    'Other'
  )
);

-- Clean up required_document references
DELETE FROM required_document
WHERE property_type_id IN (
  SELECT property_type_id FROM property_type
  WHERE property_type_name NOT IN (
    'Bare Land',
    'Bare Land with Septic',
    'Bare Land with Clubhouse',
    'Townhomes',
    'Townhomes with Septic',
    'Townhomes with Clubhouse',
    'Apartments',
    'Apartments with Clubhouse',
    'Mixed-Use: Apt over Retail',
    'Mixed-Use: Commercial',
    'Industrial',
    'Air Parcel',
    'Other'
  )
);

-- Delete property types not in the approved list
DELETE FROM property_type
WHERE property_type_name NOT IN (
  'Bare Land',
  'Bare Land with Septic',
  'Bare Land with Clubhouse',
  'Townhomes',
  'Townhomes with Septic',
  'Townhomes with Clubhouse',
  'Apartments',
  'Apartments with Clubhouse',
  'Mixed-Use: Apt over Retail',
  'Mixed-Use: Commercial',
  'Industrial',
  'Air Parcel',
  'Other'
);

-- Ensure all 13 property types exist (insert if missing)
INSERT INTO property_type (property_type_name)
VALUES
  ('Bare Land'),
  ('Bare Land with Septic'),
  ('Bare Land with Clubhouse'),
  ('Townhomes'),
  ('Townhomes with Septic'),
  ('Townhomes with Clubhouse'),
  ('Apartments'),
  ('Apartments with Clubhouse'),
  ('Mixed-Use: Apt over Retail'),
  ('Mixed-Use: Commercial'),
  ('Industrial'),
  ('Air Parcel'),
  ('Other')
ON CONFLICT (property_type_name) DO NOTHING;

-- ============================================
-- Add sort_order column and set display order
-- ============================================

-- Add the sort_order column if it doesn't exist
ALTER TABLE property_type ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Set the sort order for each property type
UPDATE property_type SET sort_order = 1  WHERE property_type_name = 'Bare Land';
UPDATE property_type SET sort_order = 2  WHERE property_type_name = 'Bare Land with Septic';
UPDATE property_type SET sort_order = 3  WHERE property_type_name = 'Bare Land with Clubhouse';
UPDATE property_type SET sort_order = 4  WHERE property_type_name = 'Townhomes';
UPDATE property_type SET sort_order = 5  WHERE property_type_name = 'Townhomes with Septic';
UPDATE property_type SET sort_order = 6  WHERE property_type_name = 'Townhomes with Clubhouse';
UPDATE property_type SET sort_order = 7  WHERE property_type_name = 'Apartments';
UPDATE property_type SET sort_order = 8  WHERE property_type_name = 'Apartments with Clubhouse';
UPDATE property_type SET sort_order = 9  WHERE property_type_name = 'Mixed-Use: Apt over Retail';
UPDATE property_type SET sort_order = 10 WHERE property_type_name = 'Mixed-Use: Commercial';
UPDATE property_type SET sort_order = 11 WHERE property_type_name = 'Industrial';
UPDATE property_type SET sort_order = 12 WHERE property_type_name = 'Air Parcel';
UPDATE property_type SET sort_order = 13 WHERE property_type_name = 'Other';
