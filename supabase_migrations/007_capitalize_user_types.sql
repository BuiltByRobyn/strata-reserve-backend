-- Migration: Capitalize user type names
-- This updates the user_type_name values to have proper capitalization

UPDATE user_type SET user_type_name = 'Administrator' WHERE user_type_name = 'administrator';
UPDATE user_type SET user_type_name = 'Inspector' WHERE user_type_name = 'inspector';
UPDATE user_type SET user_type_name = 'Client' WHERE user_type_name = 'client';
UPDATE user_type SET user_type_name = 'Assistant' WHERE user_type_name = 'assistant';
