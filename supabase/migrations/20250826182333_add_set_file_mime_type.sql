-- Add .set file MIME type to storage bucket
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY['application/octet-stream', 'text/plain', 'application/set', 'binary/octet-stream']
WHERE id = 'setfiles';





