-- Create quiz_challenges table for storing challenge metadata
CREATE TABLE public.quiz_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL,
  challenge_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  quiz_data JSONB NOT NULL,
  quiz_type TEXT NOT NULL DEFAULT 'custom',
  source_quiz_id UUID,
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_attempts INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create index on challenge_code for fast lookups
CREATE INDEX idx_quiz_challenges_code ON public.quiz_challenges(challenge_code);
CREATE INDEX idx_quiz_challenges_creator ON public.quiz_challenges(creator_id);

-- Enable Row Level Security
ALTER TABLE public.quiz_challenges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quiz_challenges
-- Anyone authenticated can view active challenges (needed for joining)
CREATE POLICY "Users can view active challenges" 
ON public.quiz_challenges 
FOR SELECT 
USING (is_active = true OR auth.uid() = creator_id);

-- Only creators can insert their own challenges
CREATE POLICY "Users can create own challenges" 
ON public.quiz_challenges 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

-- Only creators can update their own challenges
CREATE POLICY "Users can update own challenges" 
ON public.quiz_challenges 
FOR UPDATE 
USING (auth.uid() = creator_id);

-- Only creators can delete their own challenges
CREATE POLICY "Users can delete own challenges" 
ON public.quiz_challenges 
FOR DELETE 
USING (auth.uid() = creator_id);

-- Create challenge_attempts table for storing user attempts
CREATE TABLE public.challenge_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.quiz_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  max_score INTEGER NOT NULL DEFAULT 0,
  accuracy NUMERIC(5,2) NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER NOT NULL DEFAULT 0,
  answers JSONB,
  is_best_attempt BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for leaderboard queries
CREATE INDEX idx_challenge_attempts_challenge ON public.challenge_attempts(challenge_id);
CREATE INDEX idx_challenge_attempts_user ON public.challenge_attempts(user_id);
CREATE INDEX idx_challenge_attempts_leaderboard ON public.challenge_attempts(challenge_id, score DESC, time_taken_seconds ASC);

-- Enable Row Level Security
ALTER TABLE public.challenge_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenge_attempts
-- Anyone authenticated can view attempts for challenges they can see
CREATE POLICY "Users can view challenge attempts" 
ON public.challenge_attempts 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.quiz_challenges c 
    WHERE c.id = challenge_attempts.challenge_id 
    AND (c.is_active = true OR c.creator_id = auth.uid())
  )
);

-- Users can insert their own attempts
CREATE POLICY "Users can create own attempts" 
ON public.challenge_attempts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own attempts (for marking best attempt)
CREATE POLICY "Users can update own attempts" 
ON public.challenge_attempts 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can delete their own attempts
CREATE POLICY "Users can delete own attempts" 
ON public.challenge_attempts 
FOR DELETE 
USING (auth.uid() = user_id);