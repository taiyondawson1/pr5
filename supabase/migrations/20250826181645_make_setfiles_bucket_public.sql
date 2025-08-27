-- Make setfiles bucket public for downloads
UPDATE storage.buckets 
SET public = true 
WHERE id = 'setfiles';

-- Update storage policies to allow public downloads
DROP POLICY IF EXISTS "Anyone can download setfiles" ON storage.objects;

-- New policy: Anyone can download setfiles (public access)
CREATE POLICY "Anyone can download setfiles" ON storage.objects
FOR SELECT USING (
  bucket_id = 'setfiles'
);




