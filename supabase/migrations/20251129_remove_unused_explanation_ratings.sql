-- Migration: Remove unused explanation_ratings table
-- Created: 2025-11-29
-- Purpose: Clean up duplicate table that was created but never used in application

-- ==============================================================================
-- BACKGROUND:
-- Two similar tables were created for tracking feedback:
-- 1. explanation_feedback (created in 20251122175606, USED by app)
--    - Simple boolean is_helpful field
--    - No FK constraints
--    - Used by ExplanationPanel.tsx line 52
--
-- 2. explanation_ratings (created in 20251122_add_explanation_ratings, UNUSED)
--    - Complex integer rating field (-1, 0, 1)
--    - FK constraints to explanations and profiles
--    - Never referenced in application code
--
-- DECISION: Keep explanation_feedback (simpler, already in use)
--           Remove explanation_ratings (unused, redundant)
--
-- SAFETY CHECKS PERFORMED:
-- ✅ No application code references explanation_ratings
-- ✅ No other tables have FK to explanation_ratings
-- ✅ No views depend on explanation_ratings
-- ✅ ExplanationPanel.tsx confirmed using explanation_feedback
--
-- DATA LOSS WARNING:
-- If explanation_ratings table contains any data, it will be lost.
-- However, this table was never used by the application, so any data
-- would be test data only.
-- ==============================================================================

-- Step 1: Drop RLS policies
-- These must be dropped before the table can be dropped
DROP POLICY IF EXISTS "Users can view their own ratings" ON public.explanation_ratings;
DROP POLICY IF EXISTS "Users can insert their own ratings" ON public.explanation_ratings;
DROP POLICY IF EXISTS "Users can update their own ratings" ON public.explanation_ratings;
DROP POLICY IF EXISTS "Users can delete their own ratings" ON public.explanation_ratings;

-- Step 2: Drop indexes
-- Drop indexes before table for clean removal
DROP INDEX IF EXISTS public.idx_explanation_ratings_user_created;
DROP INDEX IF EXISTS public.idx_explanation_ratings_explanation;

-- Step 3: Drop the table
-- IF EXISTS makes this idempotent (safe to run multiple times)
DROP TABLE IF EXISTS public.explanation_ratings;

-- ==============================================================================
-- VERIFICATION:
-- After running this migration, verify:
-- 1. explanation_feedback table still exists (should be untouched)
-- 2. ExplanationPanel.tsx still works (uses explanation_feedback)
-- 3. No orphaned constraints remain
--
-- To verify in SQL:
--   SELECT * FROM pg_tables WHERE tablename = 'explanation_ratings';
--   -- Should return 0 rows
--
--   SELECT * FROM pg_tables WHERE tablename = 'explanation_feedback';
--   -- Should return 1 row
-- ==============================================================================

-- ==============================================================================
-- ROLLBACK INSTRUCTIONS:
-- If you need to restore the table (though it's unused), re-run the deleted
-- migration file: 20251122_add_explanation_ratings.sql
--
-- However, this is NOT recommended because:
-- - The table is not used by the application
-- - It's redundant with explanation_feedback
-- - No data would be restored (old data would be lost)
-- ==============================================================================

-- Add comment for documentation
COMMENT ON TABLE public.explanation_feedback IS
  'Tracks user feedback on explanations (is_helpful boolean). This is the active table used by ExplanationPanel.tsx. The old explanation_ratings table was removed as redundant.';
