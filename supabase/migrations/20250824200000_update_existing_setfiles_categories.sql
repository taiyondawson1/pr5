-- Update existing setfiles to have proper categories
-- Set files without category to 'forex' (for admin setfiles)
UPDATE setfiles 
SET category = 'forex' 
WHERE category IS NULL OR category = '';

-- Ensure community setfiles uploaded by non-admin users have 'community' category
UPDATE setfiles 
SET category = 'community' 
WHERE uploaded_by NOT IN (
  SELECT id FROM auth.users 
  WHERE email IN ('support@platinumai.co.uk', 'taiyondawson212@gmail.com')
);





