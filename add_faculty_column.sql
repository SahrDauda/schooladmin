-- Migration: Add faculty column to classes table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS faculty TEXT;

-- Optional: add a check constraint for valid values
ALTER TABLE public.classes
  DROP CONSTRAINT IF EXISTS classes_faculty_check;

ALTER TABLE public.classes
  ADD CONSTRAINT classes_faculty_check
    CHECK (faculty IS NULL OR faculty IN ('Science', 'Arts', 'Commercial', 'Vocational'));

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'classes'
  AND column_name  = 'faculty';
