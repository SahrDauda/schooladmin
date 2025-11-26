-- =====================================================
-- TEMPORARY: Disable RLS for Development
-- =====================================================
-- This allows anyone to create schools and school admins
-- WARNING: Only use this for development/testing!
-- Re-enable proper RLS policies for production
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view own school" ON public.schools;
DROP POLICY IF EXISTS "Admins can view own profile" ON public.schooladmin;
DROP POLICY IF EXISTS "Admins can update own profile" ON public.schooladmin;
DROP POLICY IF EXISTS "Admins can insert own profile" ON public.schooladmin;

-- Allow anyone to insert schools (for development)
CREATE POLICY "Allow anyone to create schools" ON public.schools
  FOR INSERT 
  WITH CHECK (true);

-- Allow anyone to read schools (for development)
CREATE POLICY "Allow anyone to read schools" ON public.schools
  FOR SELECT 
  USING (true);

-- Allow anyone to insert school admins (for development)
CREATE POLICY "Allow anyone to create admins" ON public.schooladmin
  FOR INSERT 
  WITH CHECK (true);

-- Allow anyone to read school admins (for development)
CREATE POLICY "Allow anyone to read admins" ON public.schooladmin
  FOR SELECT 
  USING (true);

-- Allow anyone to update school admins (for development)
CREATE POLICY "Allow anyone to update admins" ON public.schooladmin
  FOR UPDATE 
  USING (true);
  
-- =====================================================
-- Done! Now you can create school admins freely.
-- =====================================================
-- Remember to restore proper RLS policies before going to production!
-- =====================================================
