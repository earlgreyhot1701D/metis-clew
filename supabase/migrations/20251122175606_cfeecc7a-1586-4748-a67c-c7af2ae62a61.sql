-- Create recent_snippets table to track user's recent code
CREATE TABLE public.recent_snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  code text NOT NULL,
  language text NOT NULL DEFAULT 'python',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_accessed timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.recent_snippets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recent snippets"
ON public.recent_snippets FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recent snippets"
ON public.recent_snippets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recent snippets"
ON public.recent_snippets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recent snippets"
ON public.recent_snippets FOR DELETE
USING (auth.uid() = user_id);

-- Create user_preferences table for learning style and skill level
CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  dominant_pattern text,
  skill_level text DEFAULT 'beginner',
  total_explanations integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
ON public.user_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
ON public.user_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
ON public.user_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Create explanation_feedback table for tracking helpful votes
CREATE TABLE public.explanation_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  explanation_id uuid NOT NULL,
  is_helpful boolean NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.explanation_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback"
ON public.explanation_feedback FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feedback"
ON public.explanation_feedback FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create user_sessions table for tracking sessions
CREATE TABLE public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  patterns_learned integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
ON public.user_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
ON public.user_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
ON public.user_sessions FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updating user_preferences updated_at
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();