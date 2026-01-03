-- Add revision_notes column to topics table
ALTER TABLE public.topics 
ADD COLUMN revision_notes text DEFAULT NULL;

-- Create roadmap_versions table for version history
CREATE TABLE public.roadmap_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  description TEXT DEFAULT NULL
);

-- Enable RLS on roadmap_versions
ALTER TABLE public.roadmap_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for roadmap_versions (access through roadmap ownership)
CREATE POLICY "Users can view own roadmap versions"
ON public.roadmap_versions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.roadmaps r
  WHERE r.id = roadmap_versions.roadmap_id AND r.user_id = auth.uid()
));

CREATE POLICY "Users can insert own roadmap versions"
ON public.roadmap_versions FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.roadmaps r
  WHERE r.id = roadmap_versions.roadmap_id AND r.user_id = auth.uid()
));

CREATE POLICY "Users can delete own roadmap versions"
ON public.roadmap_versions FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.roadmaps r
  WHERE r.id = roadmap_versions.roadmap_id AND r.user_id = auth.uid()
));

-- Create index for faster lookups
CREATE INDEX idx_roadmap_versions_roadmap_id ON public.roadmap_versions(roadmap_id);
CREATE INDEX idx_roadmap_versions_created_at ON public.roadmap_versions(created_at DESC);