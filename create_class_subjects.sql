-- Migration: Create class_subjects table to assign teachers to subjects per class
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.class_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
    school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(class_id, subject_id)
);

ALTER TABLE public.class_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.class_subjects;
CREATE POLICY "Enable read access for all authenticated users" ON public.class_subjects FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable insert for schooladmin" ON public.class_subjects;
CREATE POLICY "Enable insert for schooladmin" ON public.class_subjects FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.schooladmin WHERE schooladmin.id = auth.uid()));

DROP POLICY IF EXISTS "Enable update for schooladmin" ON public.class_subjects;
CREATE POLICY "Enable update for schooladmin" ON public.class_subjects FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.schooladmin WHERE schooladmin.id = auth.uid()));

DROP POLICY IF EXISTS "Enable delete for schooladmin" ON public.class_subjects;
CREATE POLICY "Enable delete for schooladmin" ON public.class_subjects FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.schooladmin WHERE schooladmin.id = auth.uid()));
