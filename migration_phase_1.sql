-- Phase 1: Premium EMIS Database Hardening
-- Run this in your Supabase SQL Editor

-- 1. Grade Settings Table (School-wide Formula)
CREATE TABLE IF NOT EXISTS public.grade_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE UNIQUE,
  ca1_weight INTEGER DEFAULT 20,
  ca2_weight INTEGER DEFAULT 20,
  exam_weight INTEGER DEFAULT 60,
  pass_mark INTEGER DEFAULT 40,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Update Grades Table with Sub-scores
ALTER TABLE public.grades 
ADD COLUMN IF NOT EXISTS ca1_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ca2_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS exam_score INTEGER DEFAULT 0;

-- 3. Parents Table (Sibling Linking Support)
CREATE TABLE IF NOT EXISTS public.parents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  gender TEXT,
  occupation TEXT,
  address TEXT,
  family_id TEXT UNIQUE NOT NULL, -- Auto-generated Family ID (e.g., FAM-3829)
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Update Students with Parent Link
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.parents(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS family_id TEXT;

-- 5. Rooms Table (Facility Management)
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  capacity INTEGER,
  type TEXT DEFAULT 'Classroom', -- Classroom, Laboratory, Hall, etc.
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
  old_value JSONB,
  new_value JSONB,
  performed_by UUID REFERENCES auth.users(id),
  school_id UUID REFERENCES public.schools(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. RLS Policies for New Tables

ALTER TABLE public.grade_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Grade Settings: Admin view/manage
CREATE POLICY "Admins can manage own school grade settings" ON public.grade_settings
  FOR ALL USING (school_id = public.get_my_school_id());

-- Parents: Admin view/manage
CREATE POLICY "Admins can manage own school parents" ON public.parents
  FOR ALL USING (school_id = public.get_my_school_id());

-- Rooms: Admin view/manage
CREATE POLICY "Admins can manage own school rooms" ON public.rooms
  FOR ALL USING (school_id = public.get_my_school_id());

-- Audit Logs: Admin view only
CREATE POLICY "Admins can view own school audit logs" ON public.audit_logs
  FOR SELECT USING (school_id = public.get_my_school_id());

-- 8. Functions & Triggers (Optional but good for data integrity)

-- Function to generate Family ID
CREATE OR REPLACE FUNCTION generate_family_id() 
RETURNS TEXT AS $$
DECLARE
  new_id TEXT;
BEGIN
  LOOP
    new_id := 'FAM-' || lpad(floor(random() * 1000000)::text, 6, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.parents WHERE family_id = new_id);
  END LOOP;
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;
