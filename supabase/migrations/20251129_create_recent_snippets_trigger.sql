-- Migration: Auto-populate recent_snippets table when code is submitted
-- Created: 2025-11-29
-- Purpose: Automatically track recently viewed code snippets for each user

-- Step 1: Add UNIQUE constraint to recent_snippets for conflict resolution
-- This allows ON CONFLICT to work properly when same code is submitted multiple times
ALTER TABLE public.recent_snippets
ADD CONSTRAINT unique_user_code UNIQUE (user_id, code);

-- Step 2: Create index on last_accessed for faster queries (from audit recommendation)
CREATE INDEX IF NOT EXISTS idx_recent_snippets_last_accessed
ON public.recent_snippets (user_id, last_accessed DESC);

-- Step 3: Create trigger function to auto-populate recent_snippets
-- Uses security definer to bypass RLS policies (triggers run as system, not user)
CREATE OR REPLACE FUNCTION public.update_recent_snippets()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert new snippet or update last_accessed if duplicate
  INSERT INTO public.recent_snippets (
    user_id,
    title,
    code,
    language,
    created_at,
    last_accessed
  )
  VALUES (
    NEW.user_id,
    COALESCE(NEW.title, NEW.language || ' snippet'),  -- Handle NULL titles
    NEW.code,
    NEW.language,
    NEW.created_at,
    NOW()
  )
  ON CONFLICT (user_id, code)
  DO UPDATE SET
    last_accessed = NOW(),
    title = COALESCE(EXCLUDED.title, recent_snippets.title);  -- Preserve or update title

  RETURN NEW;
END;
$$;

-- Step 4: Create trigger that fires after code snippet insertion
CREATE TRIGGER on_snippet_created
AFTER INSERT ON public.code_snippets
FOR EACH ROW
EXECUTE FUNCTION public.update_recent_snippets();

-- Step 5: Add comment for documentation
COMMENT ON FUNCTION public.update_recent_snippets() IS
  'Automatically populates recent_snippets table when code is submitted. Updates last_accessed timestamp if code already exists for user.';

COMMENT ON TRIGGER on_snippet_created ON public.code_snippets IS
  'Maintains recent_snippets table by tracking all code submissions per user.';
