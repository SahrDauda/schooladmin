-- =====================================================
-- Add Missing Column to schooladmin Table
-- =====================================================
-- Run this to add the hasLoggedInBefore column
-- =====================================================

ALTER TABLE public.schooladmin 
ADD COLUMN IF NOT EXISTS hasLoggedInBefore BOOLEAN DEFAULT false;

-- =====================================================
-- Done! The column is now added.
-- =====================================================
