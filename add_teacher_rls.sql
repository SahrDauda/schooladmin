-- =====================================================
-- TEACHER PORTAL RLS POLICIES
-- =====================================================
-- Run this script in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run
-- =====================================================

-- Allow teachers to view their own profile
CREATE POLICY "Teachers can view their own profile" ON public.teachers
  FOR SELECT USING (auth.uid() = id);

-- Allow teachers to update their own profile (for hasloggedinbefore and other details)
CREATE POLICY "Teachers can update their own profile" ON public.teachers
  FOR UPDATE USING (auth.uid() = id);

-- =====================================================
-- Run this once, and the login will start working!
-- =====================================================
