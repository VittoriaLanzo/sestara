-- Add unique constraint on topic_id and user_id for flashcard_sets to support upsert
CREATE UNIQUE INDEX IF NOT EXISTS flashcard_sets_topic_user_unique ON public.flashcard_sets (topic_id, user_id);