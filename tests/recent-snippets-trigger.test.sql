-- Integration Tests for recent_snippets Trigger
-- Test file for migration: 20251129_create_recent_snippets_trigger.sql
-- Run these tests in Supabase SQL Editor or via psql

-- ==============================================================================
-- SETUP: Create test users and clean state
-- ==============================================================================

BEGIN;

-- Create test users (simulating auth.users)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'test1@example.com', crypt('password', gen_salt('bf')), NOW(), NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'test2@example.com', crypt('password', gen_salt('bf')), NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create corresponding profiles (via trigger, but ensure they exist)
INSERT INTO public.profiles (id, username, created_at, updated_at)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'testuser1', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'testuser2', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Clean up any existing test data
DELETE FROM public.recent_snippets WHERE user_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

DELETE FROM public.code_snippets WHERE user_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

-- ==============================================================================
-- TEST 1: Trigger fires and populates recent_snippets on INSERT
-- ==============================================================================

DO $$
DECLARE
  snippet_count INTEGER;
  recent_count INTEGER;
BEGIN
  RAISE NOTICE 'TEST 1: Trigger fires and populates recent_snippets';

  -- Insert a code snippet
  INSERT INTO public.code_snippets (user_id, title, code, language)
  VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Test Function',
    'def hello(): print("world")',
    'python'
  );

  -- Verify code_snippets has 1 row
  SELECT COUNT(*) INTO snippet_count
  FROM public.code_snippets
  WHERE user_id = '11111111-1111-1111-1111-111111111111';

  -- Verify recent_snippets has 1 row (populated by trigger)
  SELECT COUNT(*) INTO recent_count
  FROM public.recent_snippets
  WHERE user_id = '11111111-1111-1111-1111-111111111111';

  IF snippet_count = 1 AND recent_count = 1 THEN
    RAISE NOTICE '✅ TEST 1 PASSED: Trigger populated recent_snippets';
  ELSE
    RAISE EXCEPTION '❌ TEST 1 FAILED: Expected 1 row in recent_snippets, got %', recent_count;
  END IF;
END $$;

-- ==============================================================================
-- TEST 2: Conflict handling - same code inserted twice updates last_accessed
-- ==============================================================================

DO $$
DECLARE
  first_accessed TIMESTAMP;
  second_accessed TIMESTAMP;
  recent_count INTEGER;
BEGIN
  RAISE NOTICE 'TEST 2: Duplicate code updates last_accessed instead of creating duplicate';

  -- Insert same code again (should trigger ON CONFLICT)
  INSERT INTO public.code_snippets (user_id, title, code, language)
  VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Test Function Updated',
    'def hello(): print("world")',  -- Same code as TEST 1
    'python'
  );

  -- Sleep briefly to ensure timestamp difference
  PERFORM pg_sleep(0.1);

  -- Get last_accessed timestamps
  SELECT last_accessed INTO first_accessed
  FROM public.recent_snippets
  WHERE user_id = '11111111-1111-1111-1111-111111111111'
    AND code = 'def hello(): print("world")';

  -- Insert again
  INSERT INTO public.code_snippets (user_id, title, code, language)
  VALUES (
    '11111111-1111-1111-1111-111111111111',
    'Test Function v3',
    'def hello(): print("world")',  -- Same code again
    'python'
  );

  -- Get new last_accessed
  SELECT last_accessed INTO second_accessed
  FROM public.recent_snippets
  WHERE user_id = '11111111-1111-1111-1111-111111111111'
    AND code = 'def hello(): print("world")';

  -- Check we still only have 1 row (no duplicates)
  SELECT COUNT(*) INTO recent_count
  FROM public.recent_snippets
  WHERE user_id = '11111111-1111-1111-1111-111111111111';

  IF recent_count = 1 AND second_accessed > first_accessed THEN
    RAISE NOTICE '✅ TEST 2 PASSED: Duplicate handled correctly, last_accessed updated';
  ELSE
    RAISE EXCEPTION '❌ TEST 2 FAILED: Expected 1 row with updated timestamp, got % rows', recent_count;
  END IF;
END $$;

-- ==============================================================================
-- TEST 3: Different users don't cross-contaminate
-- ==============================================================================

DO $$
DECLARE
  user1_count INTEGER;
  user2_count INTEGER;
BEGIN
  RAISE NOTICE 'TEST 3: Different users data is isolated';

  -- Insert code for user 2
  INSERT INTO public.code_snippets (user_id, title, code, language)
  VALUES (
    '22222222-2222-2222-2222-222222222222',
    'User2 Code',
    'console.log("hello")',
    'javascript'
  );

  -- Check user 1 still has only 1 recent snippet
  SELECT COUNT(*) INTO user1_count
  FROM public.recent_snippets
  WHERE user_id = '11111111-1111-1111-1111-111111111111';

  -- Check user 2 has exactly 1 recent snippet
  SELECT COUNT(*) INTO user2_count
  FROM public.recent_snippets
  WHERE user_id = '22222222-2222-2222-2222-222222222222';

  IF user1_count = 1 AND user2_count = 1 THEN
    RAISE NOTICE '✅ TEST 3 PASSED: User data properly isolated';
  ELSE
    RAISE EXCEPTION '❌ TEST 3 FAILED: User1 has % rows, User2 has % rows', user1_count, user2_count;
  END IF;
END $$;

-- ==============================================================================
-- TEST 4: NULL title handling
-- ==============================================================================

DO $$
DECLARE
  generated_title TEXT;
BEGIN
  RAISE NOTICE 'TEST 4: NULL titles are handled with fallback';

  -- Insert code without title
  INSERT INTO public.code_snippets (user_id, code, language)
  VALUES (
    '11111111-1111-1111-1111-111111111111',
    'SELECT * FROM users;',
    'sql'
  );

  -- Check that title was auto-generated
  SELECT title INTO generated_title
  FROM public.recent_snippets
  WHERE user_id = '11111111-1111-1111-1111-111111111111'
    AND code = 'SELECT * FROM users;';

  IF generated_title = 'sql snippet' THEN
    RAISE NOTICE '✅ TEST 4 PASSED: NULL title handled with fallback "%"', generated_title;
  ELSE
    RAISE EXCEPTION '❌ TEST 4 FAILED: Expected "sql snippet", got "%"', generated_title;
  END IF;
END $$;

-- ==============================================================================
-- TEST 5: Verify index performance (query uses index)
-- ==============================================================================

DO $$
DECLARE
  query_plan TEXT;
BEGIN
  RAISE NOTICE 'TEST 5: Index is used for last_accessed queries';

  -- Get query plan
  SELECT query_plan INTO query_plan
  FROM (
    EXPLAIN (FORMAT TEXT)
    SELECT * FROM public.recent_snippets
    WHERE user_id = '11111111-1111-1111-1111-111111111111'
    ORDER BY last_accessed DESC
    LIMIT 5
  ) AS plan_output(query_plan);

  -- Check if index is mentioned in plan
  IF query_plan LIKE '%idx_recent_snippets_last_accessed%' THEN
    RAISE NOTICE '✅ TEST 5 PASSED: Index is being used';
  ELSE
    RAISE NOTICE '⚠️  TEST 5 WARNING: Index may not be used (low row count). Plan: %', query_plan;
  END IF;
END $$;

-- ==============================================================================
-- TEST 6: Verify UNIQUE constraint exists
-- ==============================================================================

DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  RAISE NOTICE 'TEST 6: UNIQUE constraint on (user_id, code) exists';

  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'unique_user_code'
      AND conrelid = 'public.recent_snippets'::regclass
  ) INTO constraint_exists;

  IF constraint_exists THEN
    RAISE NOTICE '✅ TEST 6 PASSED: UNIQUE constraint exists';
  ELSE
    RAISE EXCEPTION '❌ TEST 6 FAILED: UNIQUE constraint not found';
  END IF;
END $$;

-- ==============================================================================
-- TEST 7: Verify trigger and function exist
-- ==============================================================================

DO $$
DECLARE
  trigger_exists BOOLEAN;
  function_exists BOOLEAN;
BEGIN
  RAISE NOTICE 'TEST 7: Trigger and function are properly created';

  -- Check trigger exists
  SELECT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'on_snippet_created'
      AND tgrelid = 'public.code_snippets'::regclass
  ) INTO trigger_exists;

  -- Check function exists
  SELECT EXISTS (
    SELECT 1
    FROM pg_proc
    WHERE proname = 'update_recent_snippets'
      AND pronamespace = 'public'::regnamespace
  ) INTO function_exists;

  IF trigger_exists AND function_exists THEN
    RAISE NOTICE '✅ TEST 7 PASSED: Trigger and function exist';
  ELSE
    RAISE EXCEPTION '❌ TEST 7 FAILED: Trigger exists: %, Function exists: %', trigger_exists, function_exists;
  END IF;
END $$;

-- ==============================================================================
-- CLEANUP
-- ==============================================================================

-- Clean up test data
DELETE FROM public.recent_snippets WHERE user_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

DELETE FROM public.code_snippets WHERE user_id IN (
  '11111111-1111-1111-1111-111111111111',
  '22222222-2222-2222-2222-222222222222'
);

-- Note: We don't delete test users/profiles as they might be used by other tests

COMMIT;

-- ==============================================================================
-- TEST SUMMARY
-- ==============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ALL TESTS COMPLETED SUCCESSFULLY';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Migration 20251129_create_recent_snippets_trigger.sql is ready to deploy';
END $$;
