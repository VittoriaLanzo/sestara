-- Add difficulty column to quiz_attempts for tracking
ALTER TABLE public.quiz_attempts 
ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'mixed',
ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'topic',
ADD COLUMN IF NOT EXISTS time_spent_seconds integer,
ADD COLUMN IF NOT EXISTS question_states jsonb DEFAULT '[]'::jsonb;

-- Create table for quiz doubt reports
CREATE TABLE public.quiz_doubt_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_attempt_id uuid NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_index integer NOT NULL,
  doubt_type text NOT NULL,
  user_notes text,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on quiz_doubt_reports
ALTER TABLE public.quiz_doubt_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for quiz_doubt_reports
CREATE POLICY "Users can insert own doubt reports"
ON public.quiz_doubt_reports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own doubt reports"
ON public.quiz_doubt_reports
FOR SELECT
USING (auth.uid() = user_id);

-- Add mastery columns to flashcard_sets for smart learning
ALTER TABLE public.flashcard_sets
ADD COLUMN IF NOT EXISTS mastery_data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'topic',
ADD COLUMN IF NOT EXISTS source_url text,
ADD COLUMN IF NOT EXISTS last_studied_at timestamp with time zone;

-- Create table for external content (PDFs, YouTube)
CREATE TABLE public.content_sources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  topic_id uuid REFERENCES public.topics(id) ON DELETE SET NULL,
  source_type text NOT NULL CHECK (source_type IN ('pdf', 'youtube', 'manual')),
  source_url text,
  file_name text,
  extracted_content text,
  processing_status text DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on content_sources
ALTER TABLE public.content_sources ENABLE ROW LEVEL SECURITY;

-- RLS policies for content_sources
CREATE POLICY "Users can insert own content sources"
ON public.content_sources
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own content sources"
ON public.content_sources
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own content sources"
ON public.content_sources
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own content sources"
ON public.content_sources
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at on content_sources
CREATE TRIGGER update_content_sources_updated_at
BEFORE UPDATE ON public.content_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();