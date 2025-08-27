-- Create storage bucket for setfiles
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('setfiles', 'setfiles', false, 52428800, ARRAY['application/octet-stream', 'text/plain'])
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to upload setfiles
CREATE POLICY "Authenticated users can upload setfiles" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'setfiles' 
  AND auth.role() = 'authenticated'
  AND (
    auth.jwt() ->> 'email' = 'support@platinumai.co.uk' OR
    auth.jwt() ->> 'email' = 'taiyondawson212@gmail.com'
  )
);

-- Policy for authenticated users to download setfiles
CREATE POLICY "Authenticated users can download setfiles" ON storage.objects
FOR SELECT USING (
  bucket_id = 'setfiles' 
  AND auth.role() = 'authenticated'
);

-- Policy for authorized users to delete setfiles
CREATE POLICY "Authorized users can delete setfiles" ON storage.objects
FOR DELETE USING (
  bucket_id = 'setfiles' 
  AND auth.role() = 'authenticated'
  AND (
    auth.jwt() ->> 'email' = 'support@platinumai.co.uk' OR
    auth.jwt() ->> 'email' = 'taiyondawson212@gmail.com'
  )
);




