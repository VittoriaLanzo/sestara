
CREATE TABLE public.video_chat_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id text NOT NULL,
  message_index integer NOT NULL DEFAULT 0,
  artifact_type text NOT NULL,
  title text NOT NULL DEFAULT 'Untitled',
  content text NOT NULL DEFAULT '',
  source_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.video_chat_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own artifacts" ON public.video_chat_artifacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own artifacts" ON public.video_chat_artifacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own artifacts" ON public.video_chat_artifacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own artifacts" ON public.video_chat_artifacts
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_video_chat_artifacts_updated_at
  BEFORE UPDATE ON public.video_chat_artifacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
