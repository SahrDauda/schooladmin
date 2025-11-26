-- Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  present_count INT DEFAULT 0,
  absent_count INT DEFAULT 0,
  late_count INT DEFAULT 0,
  total_students INT DEFAULT 0,
  attendance_percentage FLOAT DEFAULT 0,
  students JSONB DEFAULT '{}'::jsonb, -- Stores {student_id: status}
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(class_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Teacher Attendance Table
CREATE TABLE IF NOT EXISTS public.teacher_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT DEFAULT 'present',
  sign_in_time TIMESTAMP WITH TIME ZONE,
  sign_out_time TIMESTAMP WITH TIME ZONE,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.teacher_attendance ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Attendance: Admins can manage their school's attendance
CREATE POLICY "Admins can view own school attendance" ON public.attendance
  FOR SELECT USING (school_id = public.get_my_school_id());

CREATE POLICY "Admins can manage own school attendance" ON public.attendance
  FOR ALL USING (school_id = public.get_my_school_id());

-- Teacher Attendance: Admins can manage their school's teacher attendance
CREATE POLICY "Admins can view own school teacher attendance" ON public.teacher_attendance
  FOR SELECT USING (school_id = public.get_my_school_id());

CREATE POLICY "Admins can manage own school teacher attendance" ON public.teacher_attendance
  FOR ALL USING (school_id = public.get_my_school_id());
