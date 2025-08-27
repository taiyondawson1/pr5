-- Drop existing storage policies
DROP POLICY IF EXISTS "Authenticated users can upload setfiles" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can download setfiles" ON storage.objects;
DROP POLICY IF EXISTS "Authorized users can delete setfiles" ON storage.objects;

-- New policy: Anyone can upload setfiles
CREATE POLICY "Anyone can upload setfiles" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'setfiles' 
  AND auth.role() = 'authenticated'
);

-- New policy: Anyone can download setfiles
CREATE POLICY "Anyone can download setfiles" ON storage.objects
FOR SELECT USING (
  bucket_id = 'setfiles' 
  AND auth.role() = 'authenticated'
);

-- New policy: Only authorized users can delete setfiles
CREATE POLICY "Authorized users can delete setfiles" ON storage.objects
FOR DELETE USING (
  bucket_id = 'setfiles' 
  AND auth.role() = 'authenticated'
  AND (
    auth.jwt() ->> 'email' = 'support@platinumai.co.uk' OR
    auth.jwt() ->> 'email' = 'taiyondawson212@gmail.com'
  )
);




