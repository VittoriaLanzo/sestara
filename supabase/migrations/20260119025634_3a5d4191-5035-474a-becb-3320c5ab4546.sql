-- Add DELETE policy for quiz_attempts table
CREATE POLICY "Users can delete own quiz attempts"
  ON public.quiz_attempts FOR DELETE
  USING (auth.uid() = user_id);

-- Add DELETE policy for profiles table (GDPR compliance)
CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Improve handle_new_user function with display_name length validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (
    new.id, 
    CASE 
      WHEN length(new.raw_user_meta_data ->> 'display_name') <= 100 
      THEN new.raw_user_meta_data ->> 'display_name'
      ELSE substring(new.raw_user_meta_data ->> 'display_name', 1, 100)
    END
  );
  RETURN new;
END;
$$;