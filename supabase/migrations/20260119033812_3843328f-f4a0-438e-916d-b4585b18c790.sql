-- Create custom_quizzes table for permanent quiz storage
CREATE TABLE public.custom_quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  quiz_data JSONB NOT NULL,
  group_id UUID,
  group_name TEXT DEFAULT 'General',
  times_played INTEGER DEFAULT 0,
  best_score INTEGER DEFAULT 0,
  previous_score INTEGER DEFAULT 0,
  last_opened_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz_groups table for organizing quizzes
CREATE TABLE public.quiz_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.custom_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_groups ENABLE ROW LEVEL SECURITY;

-- RLS policies for custom_quizzes
CREATE POLICY "Users can view own custom quizzes"
  ON public.custom_quizzes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own custom quizzes"
  ON public.custom_quizzes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own custom quizzes"
  ON public.custom_quizzes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own custom quizzes"
  ON public.custom_quizzes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for quiz_groups
CREATE POLICY "Users can view own quiz groups"
  ON public.quiz_groups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quiz groups"
  ON public.quiz_groups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quiz groups"
  ON public.quiz_groups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quiz groups"
  ON public.quiz_groups FOR DELETE
  USING (auth.uid() = user_id);

-- Add updated_at trigger for custom_quizzes
CREATE TRIGGER update_custom_quizzes_updated_at
  BEFORE UPDATE ON public.custom_quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();