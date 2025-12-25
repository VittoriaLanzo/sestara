-- Create topic_notes table for user notes on topics
CREATE TABLE public.topic_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create note_attachments table for PDFs and images
CREATE TABLE public.note_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  note_id UUID NOT NULL REFERENCES public.topic_notes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz_attempts table to track quiz history
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  quiz_type TEXT NOT NULL DEFAULT 'mixed',
  questions JSONB NOT NULL,
  answers JSONB,
  score INTEGER,
  max_score INTEGER,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flashcard_sets table for generated flashcards
CREATE TABLE public.flashcard_sets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  cards JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.topic_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_sets ENABLE ROW LEVEL SECURITY;

-- RLS policies for topic_notes (user can only access notes for topics they own via roadmap chain)
CREATE POLICY "Users can view own topic notes"
  ON public.topic_notes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM topics t
    JOIN subjects s ON t.subject_id = s.id
    JOIN roadmaps r ON s.roadmap_id = r.id
    WHERE t.id = topic_notes.topic_id AND r.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own topic notes"
  ON public.topic_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM topics t
    JOIN subjects s ON t.subject_id = s.id
    JOIN roadmaps r ON s.roadmap_id = r.id
    WHERE t.id = topic_notes.topic_id AND r.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own topic notes"
  ON public.topic_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own topic notes"
  ON public.topic_notes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for note_attachments (via note ownership)
CREATE POLICY "Users can view own note attachments"
  ON public.note_attachments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM topic_notes tn WHERE tn.id = note_attachments.note_id AND tn.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own note attachments"
  ON public.note_attachments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM topic_notes tn WHERE tn.id = note_attachments.note_id AND tn.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own note attachments"
  ON public.note_attachments FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM topic_notes tn WHERE tn.id = note_attachments.note_id AND tn.user_id = auth.uid()
  ));

-- RLS policies for quiz_attempts
CREATE POLICY "Users can view own quiz attempts"
  ON public.quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz attempts"
  ON public.quiz_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz attempts"
  ON public.quiz_attempts FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS policies for flashcard_sets
CREATE POLICY "Users can view own flashcard sets"
  ON public.flashcard_sets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own flashcard sets"
  ON public.flashcard_sets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flashcard sets"
  ON public.flashcard_sets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own flashcard sets"
  ON public.flashcard_sets FOR DELETE
  USING (auth.uid() = user_id);

-- Create storage bucket for note attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('note-attachments', 'note-attachments', false);

-- Storage policies for note attachments
CREATE POLICY "Users can upload own attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'note-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'note-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own attachments"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'note-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Triggers for updated_at
CREATE TRIGGER update_topic_notes_updated_at
  BEFORE UPDATE ON public.topic_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_flashcard_sets_updated_at
  BEFORE UPDATE ON public.flashcard_sets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();