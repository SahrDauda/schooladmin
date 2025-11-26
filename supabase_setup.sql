-- =====================================================
-- SUPABASE DATABASE SETUP FOR SCHOOL ADMIN (EMIS)
-- =====================================================
-- Run this entire script in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run
-- =====================================================

-- 1. CORE LOOKUP TABLES
-- =====================================================

-- Schools Table (Central tenant table)
CREATE TABLE IF NOT EXISTS public.schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  emis_code TEXT UNIQUE,
  logo_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- Academic Sessions Table
CREATE TABLE IF NOT EXISTS public.academic_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.academic_sessions ENABLE ROW LEVEL SECURITY;

-- Terms Table
CREATE TABLE IF NOT EXISTS public.terms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  session_id UUID REFERENCES public.academic_sessions(id) ON DELETE CASCADE,
  start_date DATE,
  end_date DATE,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;

-- 2. USER & STAFF TABLES
-- =====================================================

-- School Admin Table (Links Auth Users to Schools)
CREATE TABLE IF NOT EXISTS public.schooladmin (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  adminname TEXT,
  gender TEXT,
  admin_images TEXT,
  role TEXT DEFAULT 'Principal',
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  hasLoggedInBefore BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.schooladmin ENABLE ROW LEVEL SECURITY;

-- RLS Policies for schooladmin
CREATE POLICY "Admins can view own profile" ON public.schooladmin
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can update own profile" ON public.schooladmin
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can insert own profile" ON public.schooladmin
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Teachers Table
CREATE TABLE IF NOT EXISTS public.teachers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  gender TEXT,
  qualification TEXT,
  address TEXT,
  photo_url TEXT,
  status TEXT DEFAULT 'Active',
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

-- Subjects Table
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  category TEXT,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

-- Teacher Subjects Junction Table
CREATE TABLE IF NOT EXISTS public.teacher_subjects (
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  PRIMARY KEY (teacher_id, subject_id)
);

ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;

-- 3. ACADEMIC TABLES
-- =====================================================

-- Classes Table
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  capacity INT DEFAULT 50,
  form_teacher_id UUID REFERENCES public.teachers(id),
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Students Table
CREATE TABLE IF NOT EXISTS public.students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  othernames TEXT,
  gender TEXT,
  dateofbirth DATE,
  address TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  guardian_email TEXT,
  class_id UUID REFERENCES public.classes(id),
  admission_number TEXT,
  passport_url TEXT,
  status TEXT DEFAULT 'Active',
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(school_id, admission_number)
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- 4. HELPER FUNCTION FOR RLS
-- =====================================================

-- Function to get current user's school_id
CREATE OR REPLACE FUNCTION public.get_my_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM public.schooladmin WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- 5. RLS POLICIES (Multi-tenancy enforcement)
-- =====================================================

-- Schools: Admins can only see their own school
CREATE POLICY "Admins can view own school" ON public.schools
  FOR SELECT USING (id = public.get_my_school_id());

-- Teachers: School-scoped
CREATE POLICY "Admins can view own school teachers" ON public.teachers
  FOR SELECT USING (school_id = public.get_my_school_id());

CREATE POLICY "Admins can manage own school teachers" ON public.teachers
  FOR ALL USING (school_id = public.get_my_school_id());

-- Students: School-scoped
CREATE POLICY "Admins can view own school students" ON public.students
  FOR SELECT USING (school_id = public.get_my_school_id());

CREATE POLICY "Admins can manage own school students" ON public.students
  FOR ALL USING (school_id = public.get_my_school_id());

-- Classes: School-scoped
CREATE POLICY "Admins can view own school classes" ON public.classes
  FOR SELECT USING (school_id = public.get_my_school_id());

CREATE POLICY "Admins can manage own school classes" ON public.classes
  FOR ALL USING (school_id = public.get_my_school_id());

-- Subjects: School-scoped
CREATE POLICY "Admins can view own school subjects" ON public.subjects
  FOR SELECT USING (school_id = public.get_my_school_id());

CREATE POLICY "Admins can manage own school subjects" ON public.subjects
  FOR ALL USING (school_id = public.get_my_school_id());

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- Next steps:
-- 1. Go to http://localhost:3000/add-admin
-- 2. Create your first school admin account
-- 3. Log in and start using the system!
-- =====================================================
