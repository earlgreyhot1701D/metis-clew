-- Migration: Add unique constraint for explanation_feedback upsert
-- Created: 2025-12-07
-- Purpose: Add UNIQUE constraint on (explanation_id, user_id) to support
--          the upsert operation in ExplanationPanel.tsx line 59

-- ============================================================================
-- ADD UNIQUE CONSTRAINT
-- ============================================================================

-- The ExplanationPanel uses an upsert with onConflict: "explanation_id,user_id"
-- This requires a unique constraint or unique index on those columns.
ALTER TABLE public.explanation_feedback
ADD CONSTRAINT unique_explanation_user UNIQUE (explanation_id, user_id);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the constraint was created
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_explanation_user'
      AND conrelid = 'public.explanation_feedback'::regclass
  ) THEN
    RAISE NOTICE '✅ Unique constraint "unique_explanation_user" created successfully';
  ELSE
    RAISE EXCEPTION '❌ Failed to create unique constraint';
  END IF;
END $$;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS
-- ============================================================================

-- To rollback this migration, run:
-- ALTER TABLE public.explanation_feedback DROP CONSTRAINT unique_explanation_user;
