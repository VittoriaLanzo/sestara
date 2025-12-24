-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Create roadmaps table
CREATE TABLE public.roadmaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  goal_type TEXT NOT NULL, -- competitive, college, job, certification, custom
  goal_details JSONB DEFAULT '{}',
  target_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.roadmaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roadmaps" ON public.roadmaps
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own roadmaps" ON public.roadmaps
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own roadmaps" ON public.roadmaps
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own roadmaps" ON public.roadmaps
  FOR DELETE USING (auth.uid() = user_id);

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id UUID REFERENCES public.roadmaps(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subjects" ON public.subjects
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.roadmaps WHERE id = roadmap_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert own subjects" ON public.subjects
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.roadmaps WHERE id = roadmap_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update own subjects" ON public.subjects
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.roadmaps WHERE id = roadmap_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can delete own subjects" ON public.subjects
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.roadmaps WHERE id = roadmap_id AND user_id = auth.uid())
  );

-- Create topics table
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'not-started', -- not-started, in-progress, completed
  progress INTEGER DEFAULT 0,
  estimated_hours DECIMAL(4,1),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own topics" ON public.topics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.subjects s
      JOIN public.roadmaps r ON s.roadmap_id = r.id
      WHERE s.id = subject_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own topics" ON public.topics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.subjects s
      JOIN public.roadmaps r ON s.roadmap_id = r.id
      WHERE s.id = subject_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own topics" ON public.topics
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.subjects s
      JOIN public.roadmaps r ON s.roadmap_id = r.id
      WHERE s.id = subject_id AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own topics" ON public.topics
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.subjects s
      JOIN public.roadmaps r ON s.roadmap_id = r.id
      WHERE s.id = subject_id AND r.user_id = auth.uid()
    )
  );

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roadmaps_updated_at
  BEFORE UPDATE ON public.roadmaps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at
  BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_topics_updated_at
  BEFORE UPDATE ON public.topics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();