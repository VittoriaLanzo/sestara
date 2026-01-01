-- Create note_pages table for multi-page notes
CREATE TABLE public.note_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'Untitled Page',
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  color_tag TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create note_drawings table for canvas drawings
CREATE TABLE public.note_drawings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID NOT NULL REFERENCES public.note_pages(id) ON DELETE CASCADE,
  drawing_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.note_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_drawings ENABLE ROW LEVEL SECURITY;

-- RLS policies for note_pages
CREATE POLICY "Users can view own note pages"
  ON public.note_pages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own note pages"
  ON public.note_pages FOR INSERT
  WITH CHECK (auth.uid() = user_id AND EXISTS (
    SELECT 1 FROM topics t
    JOIN subjects s ON t.subject_id = s.id
    JOIN roadmaps r ON s.roadmap_id = r.id
    WHERE t.id = note_pages.topic_id AND r.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own note pages"
  ON public.note_pages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own note pages"
  ON public.note_pages FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for note_drawings
CREATE POLICY "Users can view own note drawings"
  ON public.note_drawings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM note_pages np WHERE np.id = note_drawings.page_id AND np.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own note drawings"
  ON public.note_drawings FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM note_pages np WHERE np.id = note_drawings.page_id AND np.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own note drawings"
  ON public.note_drawings FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM note_pages np WHERE np.id = note_drawings.page_id AND np.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own note drawings"
  ON public.note_drawings FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM note_pages np WHERE np.id = note_drawings.page_id AND np.user_id = auth.uid()
  ));

-- Create trigger for updating updated_at on note_pages
CREATE TRIGGER update_note_pages_updated_at
  BEFORE UPDATE ON public.note_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updating updated_at on note_drawings
CREATE TRIGGER update_note_drawings_updated_at
  BEFORE UPDATE ON public.note_drawings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();