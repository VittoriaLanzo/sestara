-- Add study_language column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS study_language text NOT NULL DEFAULT 'en';

-- Add a comment to explain the column
COMMENT ON COLUMN public.profiles.study_language IS 'Preferred language for AI-generated study content (ISO 639-1 code)';