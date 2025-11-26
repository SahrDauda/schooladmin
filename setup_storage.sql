-- =====================================================
-- STORAGE BUCKET SETUP
-- =====================================================

-- 1. Create the 'teacher-photos' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('teacher-photos', 'teacher-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on objects table (usually enabled by default, but good to ensure)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies for 'teacher-photos' bucket

-- Allow public read access to all files in the bucket
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'teacher-photos');

-- Allow authenticated users (school admins) to upload files
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'teacher-photos' AND
    auth.role() = 'authenticated'
  );

-- Allow users to update their own uploads (or admins to update any)
-- For simplicity, we allow authenticated users to update any file in this bucket for now
CREATE POLICY "Authenticated users can update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'teacher-photos' AND
    auth.role() = 'authenticated'
  );

-- Allow users to delete files
CREATE POLICY "Authenticated users can delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'teacher-photos' AND
    auth.role() = 'authenticated'
  );
