-- =====================================================
-- FIX DATABASE PERMISSIONS FOR SUPABASE & PRISMA
-- =====================================================
-- Run this script in your Supabase SQL Editor:
-- Dashboard -> SQL Editor -> New Query -> Paste & Run
-- =====================================================

-- 1. Ensure usage on public schema is granted to Supabase roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Grant all privileges on all existing tables, sequences, and functions to Supabase roles
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- 3. Alter default privileges so future tables/sequences/functions created by Prisma
-- (or any other role/connection) automatically grant access to Supabase roles
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- 4. Re-enable/re-run RLS helper function permissions if needed
CREATE OR REPLACE FUNCTION public.get_my_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM public.schooladmin WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_my_school_id() TO anon, authenticated, service_role;

-- =====================================================
-- Permissions fixed successfully!
-- =====================================================

