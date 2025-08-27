-- Fix setfiles categorization
-- First, let's see what we have and categorize based on upload context
-- For now, let's set a clear rule: if category is 'community', keep it as community
-- If category is anything else or null, it's an admin setfile

-- Keep existing community files as community
-- (no action needed for files already marked as 'community')

-- Set all other files to 'forex' (admin setfiles)
UPDATE setfiles 
SET category = 'forex' 
WHERE category IS NULL OR category = '' OR category != 'community';





