
-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public uploads (INSERT) to any bucket
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (true);

-- Allow public reads (SELECT) from any bucket  
CREATE POLICY "Allow public reads" ON storage.objects
FOR SELECT USING (true);

-- Allow public updates (UPDATE) to any bucket
CREATE POLICY "Allow public updates" ON storage.objects
FOR UPDATE USING (true);

-- Allow public deletes (DELETE) from any bucket
CREATE POLICY "Allow public deletes" ON storage.objects
FOR DELETE USING (true);
