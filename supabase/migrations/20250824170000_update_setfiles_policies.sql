-- Drop existing policies
DROP POLICY IF EXISTS "Authorized users can insert setfiles" ON setfiles;
DROP POLICY IF EXISTS "Authorized users can update setfiles" ON setfiles;
DROP POLICY IF EXISTS "Authorized users can delete setfiles" ON setfiles;

-- New policy: Anyone can insert setfiles (for community uploads)
CREATE POLICY "Anyone can insert setfiles" ON setfiles
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- New policy: Anyone can update setfiles (for download counts, ratings, etc.)
CREATE POLICY "Anyone can update setfiles" ON setfiles
FOR UPDATE USING (auth.role() = 'authenticated');

-- New policy: Only authorized users can delete setfiles
CREATE POLICY "Authorized users can delete setfiles" ON setfiles
FOR DELETE USING (
  auth.jwt() ->> 'email' = 'support@platinumai.co.uk' OR
  auth.jwt() ->> 'email' = 'taiyondawson212@gmail.com'
);





