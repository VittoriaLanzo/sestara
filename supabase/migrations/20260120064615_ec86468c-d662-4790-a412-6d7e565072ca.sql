-- Create resource_groups table for organizing resources within a roadmap
CREATE TABLE public.resource_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'blue',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_playlist BOOLEAN NOT NULL DEFAULT false,
  playlist_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create roadmap_resources table for storing individual resources
CREATE TABLE public.roadmap_resources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  roadmap_id UUID NOT NULL REFERENCES public.roadmaps(id) ON DELETE CASCADE,
  group_id UUID REFERENCES public.resource_groups(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  resource_type TEXT NOT NULL DEFAULT 'video', -- 'video' or 'playlist'
  thumbnail_url TEXT,
  duration TEXT,
  notes TEXT,
  is_watched BOOLEAN NOT NULL DEFAULT false,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for resource_groups
ALTER TABLE public.resource_groups ENABLE ROW LEVEL SECURITY;

-- RLS policies for resource_groups
CREATE POLICY "Users can view own resource groups"
  ON public.resource_groups
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resource groups"
  ON public.resource_groups
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resource groups"
  ON public.resource_groups
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own resource groups"
  ON public.resource_groups
  FOR DELETE
  USING (auth.uid() = user_id);

-- Enable RLS for roadmap_resources
ALTER TABLE public.roadmap_resources ENABLE ROW LEVEL SECURITY;

-- RLS policies for roadmap_resources
CREATE POLICY "Users can view own roadmap resources"
  ON public.roadmap_resources
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roadmap resources"
  ON public.roadmap_resources
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own roadmap resources"
  ON public.roadmap_resources
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own roadmap resources"
  ON public.roadmap_resources
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_resource_groups_updated_at
  BEFORE UPDATE ON public.resource_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roadmap_resources_updated_at
  BEFORE UPDATE ON public.roadmap_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_resource_groups_roadmap_id ON public.resource_groups(roadmap_id);
CREATE INDEX idx_resource_groups_user_id ON public.resource_groups(user_id);
CREATE INDEX idx_roadmap_resources_roadmap_id ON public.roadmap_resources(roadmap_id);
CREATE INDEX idx_roadmap_resources_group_id ON public.roadmap_resources(group_id);
CREATE INDEX idx_roadmap_resources_user_id ON public.roadmap_resources(user_id);