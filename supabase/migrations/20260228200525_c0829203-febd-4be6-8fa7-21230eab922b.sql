
-- Create a function that returns a challenge by code with answers stripped for non-creators
CREATE OR REPLACE FUNCTION public.get_challenge_by_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_challenge record;
  v_result jsonb;
  v_quiz_data jsonb;
  v_questions jsonb;
  v_current_user uuid;
BEGIN
  v_current_user := auth.uid();
  
  SELECT * INTO v_challenge
  FROM public.quiz_challenges
  WHERE challenge_code = upper(p_code)
    AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- If the current user is the creator, return full data
  IF v_current_user = v_challenge.creator_id THEN
    v_quiz_data := v_challenge.quiz_data;
  ELSE
    -- Strip correctAnswer and explanation from each question
    SELECT jsonb_agg(
      q - 'correctAnswer' - 'explanation'
    )
    INTO v_questions
    FROM jsonb_array_elements(v_challenge.quiz_data -> 'questions') AS q;
    
    v_quiz_data := v_challenge.quiz_data;
    v_quiz_data := jsonb_set(v_quiz_data, '{questions}', COALESCE(v_questions, '[]'::jsonb));
  END IF;
  
  v_result := jsonb_build_object(
    'id', v_challenge.id,
    'creator_id', v_challenge.creator_id,
    'challenge_code', v_challenge.challenge_code,
    'title', v_challenge.title,
    'quiz_data', v_quiz_data,
    'quiz_type', v_challenge.quiz_type,
    'source_quiz_id', v_challenge.source_quiz_id,
    'is_active', v_challenge.is_active,
    'max_attempts', v_challenge.max_attempts,
    'created_at', v_challenge.created_at,
    'expires_at', v_challenge.expires_at
  );
  
  RETURN v_result;
END;
$$;

-- Also create a function to verify answers server-side
CREATE OR REPLACE FUNCTION public.score_challenge_attempt(
  p_challenge_id uuid,
  p_answers jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_challenge record;
  v_questions jsonb;
  v_question jsonb;
  v_score integer := 0;
  v_max_score integer := 0;
  v_correct_answers jsonb := '{}'::jsonb;
BEGIN
  SELECT * INTO v_challenge
  FROM public.quiz_challenges
  WHERE id = p_challenge_id AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Challenge not found');
  END IF;
  
  v_questions := v_challenge.quiz_data -> 'questions';
  v_max_score := jsonb_array_length(v_questions);
  
  FOR v_question IN SELECT * FROM jsonb_array_elements(v_questions)
  LOOP
    DECLARE
      v_qid text := v_question ->> 'id';
      v_correct text := v_question ->> 'correctAnswer';
      v_user_answer text;
    BEGIN
      v_user_answer := p_answers ->> v_qid;
      
      IF v_user_answer IS NOT NULL AND upper(trim(v_user_answer)) = upper(trim(v_correct)) THEN
        v_score := v_score + 1;
      END IF;
      
      -- Include correct answer in response for review
      v_correct_answers := v_correct_answers || jsonb_build_object(v_qid, v_correct);
    END;
  END LOOP;
  
  RETURN jsonb_build_object(
    'score', v_score,
    'max_score', v_max_score,
    'correct_answers', v_correct_answers
  );
END;
$$;
