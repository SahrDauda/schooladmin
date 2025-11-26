-- =====================================================
-- Add Missing Columns to schooladmin Table
-- =====================================================
-- Run this to add all missing columns that the app expects
-- =====================================================

-- Add hasLoggedInBefore column
ALTER TABLE public.schooladmin 
ADD COLUMN IF NOT EXISTS hasLoggedInBefore BOOLEAN DEFAULT false;

-- Add status column
ALTER TABLE public.schooladmin 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';

-- Add schoolName column (for compatibility with old code)
ALTER TABLE public.schooladmin 
ADD COLUMN IF NOT EXISTS schoolName TEXT;

-- =====================================================
-- Done! All missing columns are now added.
-- =====================================================
