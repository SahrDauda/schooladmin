-- Add stage column to schools table
-- This allows schools to be categorized as Primary, Junior Secondary, or Senior Secondary

ALTER TABLE public.schools 
ADD COLUMN IF NOT EXISTS stage TEXT;

-- Add a check constraint to ensure only valid values
ALTER TABLE public.schools
ADD CONSTRAINT schools_stage_check 
CHECK (stage IN ('Primary', 'Junior Secondary', 'Senior Secondary'));

-- Add a comment to document the column
COMMENT ON COLUMN public.schools.stage IS 'School stage: Primary, Junior Secondary, or Senior Secondary';
