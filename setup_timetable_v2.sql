-- Timetable Periods Table 
-- This stores the daily structure for a school (e.g. 8:00-8:30 Devotion)
CREATE TABLE IF NOT EXISTS public.timetable_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES public.schools(id) ON DELETE CASCADE,
  label TEXT NOT NULL, -- e.g., "Period 1", "Lunch", "Devotion"
  start_time TEXT NOT NULL, -- Format: "HH:MM"
  end_time TEXT NOT NULL, -- Format: "HH:MM"
  type TEXT NOT NULL CHECK (type IN ('class', 'break', 'devotion', 'other')),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.timetable_periods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view own school periods" ON public.timetable_periods
  FOR SELECT USING (school_id = public.get_my_school_id());

CREATE POLICY "Admins can manage own school periods" ON public.timetable_periods
  FOR ALL USING (school_id = public.get_my_school_id());
