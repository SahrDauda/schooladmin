-- =====================================================
-- SECURE DATABASE: ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================
-- Run this script in your Supabase SQL Editor to turn
-- the tables from UNRESTRICTED to SECURE (RESTRICTED).
-- =====================================================

-- 1. Enable RLS on all tables
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schooladmin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_slots ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can view own school" ON public.schools;
DROP POLICY IF EXISTS "Admins can update own school" ON public.schools;
DROP POLICY IF EXISTS "Admins can view own profile" ON public.schooladmin;
DROP POLICY IF EXISTS "Admins can update own profile" ON public.schooladmin;
DROP POLICY IF EXISTS "Admins can insert own profile" ON public.schooladmin;

DROP POLICY IF EXISTS "Admins can view own school teachers" ON public.teachers;
DROP POLICY IF EXISTS "Admins can manage own school teachers" ON public.teachers;
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;

DROP POLICY IF EXISTS "Admins can view own school students" ON public.students;
DROP POLICY IF EXISTS "Admins can manage own school students" ON public.students;
DROP POLICY IF EXISTS "Admins can manage students" ON public.students;

DROP POLICY IF EXISTS "Admins can view own school classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can manage own school classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can manage classes" ON public.classes;

DROP POLICY IF EXISTS "Admins can view own school subjects" ON public.subjects;
DROP POLICY IF EXISTS "Admins can manage own school subjects" ON public.subjects;
DROP POLICY IF EXISTS "Admins can manage subjects" ON public.subjects;

-- 3. Create Row-level policies for Multi-Tenancy

-- Schools: Admin can read/update their own school
CREATE POLICY "Admins can view own school" ON public.schools
  FOR SELECT USING (id = public.get_my_school_id());
CREATE POLICY "Admins can update own school" ON public.schools
  FOR UPDATE USING (id = public.get_my_school_id());

-- SchoolAdmin: Admin can manage their own profile
CREATE POLICY "Admins can view own profile" ON public.schooladmin
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can update own profile" ON public.schooladmin
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can insert own profile" ON public.schooladmin
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Teachers
CREATE POLICY "Admins can manage teachers" ON public.teachers
  FOR ALL USING (school_id = public.get_my_school_id());

-- Students
CREATE POLICY "Admins can manage students" ON public.students
  FOR ALL USING (school_id = public.get_my_school_id());

-- Classes
CREATE POLICY "Admins can manage classes" ON public.classes
  FOR ALL USING (school_id = public.get_my_school_id());

-- Subjects
CREATE POLICY "Admins can manage subjects" ON public.subjects
  FOR ALL USING (school_id = public.get_my_school_id());

-- Academic Sessions
CREATE POLICY "Admins can manage academic_sessions" ON public.academic_sessions
  FOR ALL USING (school_id = public.get_my_school_id());

-- Terms (Note: terms refers to academic_sessions. session_id is a foreign key. We join via academic_sessions to check school_id)
CREATE POLICY "Admins can manage terms" ON public.terms
  FOR ALL USING (
    session_id IN (
      SELECT id FROM public.academic_sessions WHERE school_id = public.get_my_school_id()
    )
  );

-- Teacher Subjects (Join via teachers table)
CREATE POLICY "Admins can manage teacher_subjects" ON public.teacher_subjects
  FOR ALL USING (
    teacher_id IN (
      SELECT id FROM public.teachers WHERE school_id = public.get_my_school_id()
    )
  );

-- Grades
CREATE POLICY "Admins can manage grades" ON public.grades
  FOR ALL USING (school_id = public.get_my_school_id());

-- Notifications
CREATE POLICY "Admins can manage notifications" ON public.notifications
  FOR ALL USING (school_id = public.get_my_school_id());

-- Attendance
CREATE POLICY "Admins can manage attendance" ON public.attendance
  FOR ALL USING (school_id = public.get_my_school_id());

-- Subject Assignments
CREATE POLICY "Admins can manage subject_assignments" ON public.subject_assignments
  FOR ALL USING (
    student_id IN (
      SELECT id FROM public.students WHERE school_id = public.get_my_school_id()
    )
  );

-- Timetable Slots
CREATE POLICY "Admins can manage timetable_slots" ON public.timetable_slots
  FOR ALL USING (school_id = public.get_my_school_id());

-- =====================================================
-- Security Policies applied!
-- =====================================================
