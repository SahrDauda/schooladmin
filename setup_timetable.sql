-- Timetable Table
CREATE TABLE IF NOT EXISTS public.timetable (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id TEXT NOT NULL, -- Can be a real UUID or a virtual ID (e.g. "primary_class-1_A")
  day TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  subject TEXT NOT NULL,
  teacher_id UUID REFERENCES public.teachers(id),
  room TEXT,
  type TEXT NOT NULL CHECK (type IN ('class', 'exam')),
  date DATE, -- For exams
  examiner TEXT, -- For exams
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  schoolname TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view own school timetable" ON public.timetable
  FOR SELECT USING (school_id = public.get_my_school_id());

CREATE POLICY "Admins can manage own school timetable" ON public.timetable
  FOR ALL USING (school_id = public.get_my_school_id());
