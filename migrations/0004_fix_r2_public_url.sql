-- Migration: Fix R2 Public URL
-- Update lessons with correct R2 public URL after enabling public access

UPDATE lessons 
SET content_url = 'https://pub-16856a23f68347f2ae1c5b71791e9070.r2.dev/content/A1/01-motorcycle-basics/lesson-01-introduction/'
WHERE id = 'les-a1-welcome';

UPDATE lessons 
SET content_url = 'https://pub-16856a23f68347f2ae1c5b71791e9070.r2.dev/content/A1/02-road-safety/lesson-01-defensive-riding/'
WHERE id = 'les-a1-safety';
