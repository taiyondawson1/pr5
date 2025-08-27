-- Create setfile_ratings table
CREATE TABLE IF NOT EXISTS setfile_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setfile_id UUID REFERENCES setfiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(setfile_id, user_id)
);

-- Enable RLS
ALTER TABLE setfile_ratings ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view ratings
CREATE POLICY "Anyone can view setfile ratings" ON setfile_ratings
FOR SELECT USING (true);

-- Policy: Authenticated users can insert ratings
CREATE POLICY "Authenticated users can insert setfile ratings" ON setfile_ratings
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own ratings
CREATE POLICY "Users can update their own ratings" ON setfile_ratings
FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own ratings
CREATE POLICY "Users can delete their own ratings" ON setfile_ratings
FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_setfile_ratings_updated_at 
  BEFORE UPDATE ON setfile_ratings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create a view to calculate average ratings
CREATE OR REPLACE VIEW setfile_rating_summary AS
SELECT 
  setfile_id,
  COUNT(*) as rating_count,
  AVG(rating) as average_rating
FROM setfile_ratings
GROUP BY setfile_id;

-- Update the setfiles table to use the calculated ratings
-- This will be handled by a trigger or application logic




