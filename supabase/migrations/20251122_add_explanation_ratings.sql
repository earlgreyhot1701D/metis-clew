-- Create explanation_ratings table for tracking user ratings of explanations
CREATE TABLE public.explanation_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  explanation_id uuid NOT NULL REFERENCES public.explanations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Ensure rating is one of -1 (thumbs down), 0 (neutral), 1 (thumbs up)
  CONSTRAINT valid_rating CHECK (rating IN (-1, 0, 1)),

  -- Prevent duplicate ratings from the same user on the same explanation
  UNIQUE(explanation_id, user_id)
);

-- Create index on user_id and created_at for fast queries
CREATE INDEX idx_explanation_ratings_user_created
  ON public.explanation_ratings(user_id, created_at DESC);

-- Create additional index on explanation_id for lookups
CREATE INDEX idx_explanation_ratings_explanation
  ON public.explanation_ratings(explanation_id);

-- Enable Row Level Security
ALTER TABLE public.explanation_ratings ENABLE ROW LEVEL SECURITY;

-- RLS policies for explanation_ratings
CREATE POLICY "Users can view their own ratings"
  ON public.explanation_ratings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ratings"
  ON public.explanation_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
  ON public.explanation_ratings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
  ON public.explanation_ratings FOR DELETE
  USING (auth.uid() = user_id);
