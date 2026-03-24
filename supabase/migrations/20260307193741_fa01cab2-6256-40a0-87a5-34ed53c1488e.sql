
CREATE TABLE public.video_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  video_id text NOT NULL,
  video_title text,
  video_url text,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.video_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_video_chat_messages_user_video ON public.video_chat_messages (user_id, video_id, created_at);

CREATE POLICY "Users can view own video chat messages"
  ON public.video_chat_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own video chat messages"
  ON public.video_chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own video chat messages"
  ON public.video_chat_messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
