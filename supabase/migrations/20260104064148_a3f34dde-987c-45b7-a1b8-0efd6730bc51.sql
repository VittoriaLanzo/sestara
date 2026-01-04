-- Create study_activities table to track meaningful user actions
CREATE TABLE public.study_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL, -- 'topic_completed', 'quiz_attempted', 'notes_edited', 'progress_updated', 'flashcard_studied'
  topic_id UUID,
  roadmap_id UUID,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_streaks table to track streak data
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.study_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Policies for study_activities
CREATE POLICY "Users can view own study activities" 
ON public.study_activities FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own study activities" 
ON public.study_activities FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policies for user_streaks
CREATE POLICY "Users can view own streaks" 
ON public.user_streaks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks" 
ON public.user_streaks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" 
ON public.user_streaks FOR UPDATE 
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_study_activities_user_date ON public.study_activities(user_id, activity_date);
CREATE INDEX idx_user_streaks_user ON public.user_streaks(user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_user_streaks_updated_at
BEFORE UPDATE ON public.user_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();