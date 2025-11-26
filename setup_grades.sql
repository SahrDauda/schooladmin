-- Grades Table
CREATE TABLE IF NOT EXISTS public.grades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id), -- Optional, as admin might add grades
  term TEXT NOT NULL,
  year TEXT NOT NULL DEFAULT to_char(now(), 'YYYY'),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  comment TEXT,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Grades: Admins can manage their school's grades
CREATE POLICY "Admins can view own school grades" ON public.grades
  FOR SELECT USING (school_id = public.get_my_school_id());

CREATE POLICY "Admins can manage own school grades" ON public.grades
  FOR ALL USING (school_id = public.get_my_school_id());
