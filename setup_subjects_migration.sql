-- Create Departments Table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  schoolname TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- RLS for Departments
CREATE POLICY "Admins can view own school departments" ON public.departments
  FOR SELECT USING (school_id = public.get_my_school_id());

CREATE POLICY "Admins can manage own school departments" ON public.departments
  FOR ALL USING (school_id = public.get_my_school_id());

-- Add missing columns to subjects table
ALTER TABLE public.subjects 
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS level TEXT,
ADD COLUMN IF NOT EXISTS assigned_teacher UUID REFERENCES public.teachers(id),
ADD COLUMN IF NOT EXISTS assigned_teacher_name TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- Add missing columns to teachers table (to support existing logic)
ALTER TABLE public.teachers
ADD COLUMN IF NOT EXISTS subject TEXT,
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id);

-- Add RLS for subjects updates (if not already covered by ALL policy)
-- The existing policy "Admins can manage own school subjects" covers ALL, so we are good.
