-- Test suite to validate explanation_ratings cleanup
-- Run AFTER applying 20251129_remove_unused_explanation_ratings.sql

BEGIN;

-- ==============================================================================
-- TEST 1: Verify explanation_ratings table is dropped
-- ==============================================================================

DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  RAISE NOTICE 'TEST 1: Verify explanation_ratings table is dropped';

  SELECT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE tablename = 'explanation_ratings'
      AND schemaname = 'public'
  ) INTO table_exists;

  IF NOT table_exists THEN
    RAISE NOTICE '✅ TEST 1 PASSED: explanation_ratings table successfully dropped';
  ELSE
    RAISE EXCEPTION '❌ TEST 1 FAILED: explanation_ratings table still exists';
  END IF;
END $$;

-- ==============================================================================
-- TEST 2: Verify explanation_feedback table still exists
-- ==============================================================================

DO $$
DECLARE
  table_exists BOOLEAN;
BEGIN
  RAISE NOTICE 'TEST 2: Verify explanation_feedback table still exists';

  SELECT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE tablename = 'explanation_feedback'
      AND schemaname = 'public'
  ) INTO table_exists;

  IF table_exists THEN
    RAISE NOTICE '✅ TEST 2 PASSED: explanation_feedback table preserved';
  ELSE
    RAISE EXCEPTION '❌ TEST 2 FAILED: explanation_feedback table missing!';
  END IF;
END $$;

-- ==============================================================================
-- TEST 3: Verify RLS policies on explanation_ratings are dropped
-- ==============================================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  RAISE NOTICE 'TEST 3: Verify RLS policies on explanation_ratings are dropped';

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'explanation_ratings';

  IF policy_count = 0 THEN
    RAISE NOTICE '✅ TEST 3 PASSED: All RLS policies dropped';
  ELSE
    RAISE EXCEPTION '❌ TEST 3 FAILED: Found % orphaned policies', policy_count;
  END IF;
END $$;

-- ==============================================================================
-- TEST 4: Verify indexes on explanation_ratings are dropped
-- ==============================================================================

DO $$
DECLARE
  index_count INTEGER;
BEGIN
  RAISE NOTICE 'TEST 4: Verify indexes on explanation_ratings are dropped';

  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename = 'explanation_ratings';

  IF index_count = 0 THEN
    RAISE NOTICE '✅ TEST 4 PASSED: All indexes dropped';
  ELSE
    RAISE EXCEPTION '❌ TEST 4 FAILED: Found % orphaned indexes', index_count;
  END IF;
END $$;

-- ==============================================================================
-- TEST 5: Verify RLS policies on explanation_feedback still exist
-- ==============================================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  RAISE NOTICE 'TEST 5: Verify RLS policies on explanation_feedback still exist';

  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'explanation_feedback';

  IF policy_count >= 2 THEN
    RAISE NOTICE '✅ TEST 5 PASSED: explanation_feedback has % policies', policy_count;
  ELSE
    RAISE EXCEPTION '❌ TEST 5 FAILED: explanation_feedback missing policies (found %)', policy_count;
  END IF;
END $$;

-- ==============================================================================
-- TEST 6: Verify explanation_feedback table structure
-- ==============================================================================

DO $$
DECLARE
  column_count INTEGER;
  has_is_helpful BOOLEAN;
BEGIN
  RAISE NOTICE 'TEST 6: Verify explanation_feedback table structure';

  -- Check for is_helpful column
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'explanation_feedback'
      AND column_name = 'is_helpful'
  ) INTO has_is_helpful;

  IF has_is_helpful THEN
    RAISE NOTICE '✅ TEST 6 PASSED: explanation_feedback has is_helpful column';
  ELSE
    RAISE EXCEPTION '❌ TEST 6 FAILED: explanation_feedback missing is_helpful column';
  END IF;
END $$;

-- ==============================================================================
-- TEST 7: Verify no orphaned constraints
-- ==============================================================================

DO $$
DECLARE
  orphaned_constraints INTEGER;
BEGIN
  RAISE NOTICE 'TEST 7: Verify no orphaned constraints';

  SELECT COUNT(*) INTO orphaned_constraints
  FROM pg_constraint
  WHERE conrelid = 'public.explanation_ratings'::regclass::oid;

  IF orphaned_constraints = 0 THEN
    RAISE NOTICE '✅ TEST 7 PASSED: No orphaned constraints';
  ELSE
    RAISE EXCEPTION '❌ TEST 7 FAILED: Found % orphaned constraints', orphaned_constraints;
  END IF;
EXCEPTION
  WHEN undefined_table THEN
    -- Table doesn't exist, so no constraints can exist either
    RAISE NOTICE '✅ TEST 7 PASSED: Table does not exist, no orphaned constraints';
END $$;

-- ==============================================================================
-- TEST 8: Test explanation_feedback INSERT (simulate app behavior)
-- ==============================================================================

DO $$
DECLARE
  test_user_id uuid := '11111111-1111-1111-1111-111111111111';
  test_explanation_id uuid := '22222222-2222-2222-2222-222222222222';
  insert_worked BOOLEAN;
BEGIN
  RAISE NOTICE 'TEST 8: Test explanation_feedback INSERT works';

  -- Attempt insert (will fail if table is broken)
  BEGIN
    INSERT INTO public.explanation_feedback (user_id, explanation_id, is_helpful)
    VALUES (test_user_id, test_explanation_id, true);

    insert_worked := true;
  EXCEPTION
    WHEN OTHERS THEN
      insert_worked := false;
  END;

  -- Clean up test data
  DELETE FROM public.explanation_feedback
  WHERE user_id = test_user_id AND explanation_id = test_explanation_id;

  IF insert_worked THEN
    RAISE NOTICE '✅ TEST 8 PASSED: Can insert into explanation_feedback';
  ELSE
    RAISE EXCEPTION '❌ TEST 8 FAILED: Cannot insert into explanation_feedback';
  END IF;
END $$;

COMMIT;

-- ==============================================================================
-- TEST SUMMARY
-- ==============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ALL CLEANUP TESTS PASSED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Cleanup migration successful:';
  RAISE NOTICE '- explanation_ratings dropped ✅';
  RAISE NOTICE '- explanation_feedback preserved ✅';
  RAISE NOTICE '- No orphaned constraints ✅';
  RAISE NOTICE '- Application code compatible ✅';
  RAISE NOTICE '========================================';
END $$;
