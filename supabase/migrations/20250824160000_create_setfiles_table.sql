-- Create setfiles table
CREATE TABLE IF NOT EXISTS setfiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  storage_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  downloads INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0,
  status TEXT DEFAULT 'testing' CHECK (status IN ('active', 'inactive', 'testing')),
  category TEXT DEFAULT 'forex',
  risk_level TEXT DEFAULT 'medium',
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE setfiles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view setfiles
CREATE POLICY "Anyone can view setfiles" ON setfiles
FOR SELECT USING (true);

-- Policy: Only authorized users can insert setfiles
CREATE POLICY "Authorized users can insert setfiles" ON setfiles
FOR INSERT WITH CHECK (
  auth.jwt() ->> 'email' = 'support@platinumai.co.uk' OR
  auth.jwt() ->> 'email' = 'taiyondawson212@gmail.com'
);

-- Policy: Only authorized users can update setfiles
CREATE POLICY "Authorized users can update setfiles" ON setfiles
FOR UPDATE USING (
  auth.jwt() ->> 'email' = 'support@platinumai.co.uk' OR
  auth.jwt() ->> 'email' = 'taiyondawson212@gmail.com'
);

-- Policy: Only authorized users can delete setfiles
CREATE POLICY "Authorized users can delete setfiles" ON setfiles
FOR DELETE USING (
  auth.jwt() ->> 'email' = 'support@platinumai.co.uk' OR
  auth.jwt() ->> 'email' = 'taiyondawson212@gmail.com'
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_setfiles_updated_at 
  BEFORE UPDATE ON setfiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

