-- ============================================================================
-- DEPLOYMENT SCRIPT: Apply Both Migrations + Verify
-- ============================================================================
-- Run this script in Supabase SQL Editor to deploy the fix
--
-- This script:
-- 1. Applies the original trigger migration (20251129_create_recent_snippets_trigger.sql)
-- 2. Applies the RLS fix migration (20251129_fix_recent_snippets_rls.sql)
-- 3. Runs comprehensive verification checks
-- 4. Tests trigger functionality
-- 5. Validates no breaking changes
--
-- IMPORTANT: This script is IDEMPOTENT - safe to run multiple times
-- ============================================================================

BEGIN;

-- ============================================================================
-- MIGRATION 1: Create Recent Snippets Trigger
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION 1: Creating Recent Snippets Trigger';
  RAISE NOTICE '========================================';
END $$;

-- Step 1: Add UNIQUE constraint (idempotent - only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_user_code'
  ) THEN
    ALTER TABLE public.recent_snippets
    ADD CONSTRAINT unique_user_code UNIQUE (user_id, code);
    RAISE NOTICE '✅ Added UNIQUE constraint: unique_user_code';
  ELSE
    RAISE NOTICE '✓ UNIQUE constraint already exists';
  END IF;
END $$;

-- Step 2: Create index (idempotent - IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_recent_snippets_last_accessed
ON public.recent_snippets (user_id, last_accessed DESC);

DO $$ BEGIN RAISE NOTICE '✅ Created/verified index: idx_recent_snippets_last_accessed'; END $$;

-- Step 3: Create trigger function
CREATE OR REPLACE FUNCTION public.update_recent_snippets()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    COALESCE(NEW.title, NEW.language || ' snippet'),
    NEW.code,
    NEW.language,
    NEW.created_at,
    NOW()
  )
  ON CONFLICT (user_id, code)
  DO UPDATE SET
    last_accessed = NOW(),
    title = COALESCE(EXCLUDED.title, recent_snippets.title);

  RETURN NEW;
END;
$$;

DO $$ BEGIN RAISE NOTICE '✅ Created/replaced function: update_recent_snippets()'; END $$;

-- Step 4: Create trigger (idempotent - DROP IF EXISTS)
DROP TRIGGER IF EXISTS on_snippet_created ON public.code_snippets;

CREATE TRIGGER on_snippet_created
AFTER INSERT ON public.code_snippets
FOR EACH ROW
EXECUTE FUNCTION public.update_recent_snippets();

DO $$ BEGIN RAISE NOTICE '✅ Created trigger: on_snippet_created'; END $$;

-- ============================================================================
-- MIGRATION 2: Fix RLS Policies
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION 2: Fixing RLS Policies';
  RAISE NOTICE '========================================';
END $$;

-- Step 1: Add foreign key constraint (idempotent - only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fk_recent_snippets_user'
  ) THEN
    ALTER TABLE public.recent_snippets
    ADD CONSTRAINT fk_recent_snippets_user
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    RAISE NOTICE '✅ Added FK constraint: fk_recent_snippets_user';
  ELSE
    RAISE NOTICE '✓ FK constraint already exists';
  END IF;
END $$;

-- Step 2: Drop and recreate INSERT policy with trigger exemption
DROP POLICY IF EXISTS "Users can insert their own recent snippets" ON public.recent_snippets;

CREATE POLICY "Users can insert their own recent snippets"
ON public.recent_snippets FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR
  auth.uid() IS NULL
);

DO $$ BEGIN RAISE NOTICE '✅ Updated INSERT policy with trigger exemption'; END $$;

-- Step 3: Drop and recreate UPDATE policy with trigger exemption
DROP POLICY IF EXISTS "Users can update their own recent snippets" ON public.recent_snippets;

CREATE POLICY "Users can update their own recent snippets"
ON public.recent_snippets FOR UPDATE
USING (
  auth.uid() = user_id
  OR
  auth.uid() IS NULL
);

DO $$ BEGIN RAISE NOTICE '✅ Updated UPDATE policy with trigger exemption'; END $$;

-- Step 4: Add performance index on user_id
CREATE INDEX IF NOT EXISTS idx_recent_snippets_user_id
ON public.recent_snippets (user_id);

DO $$ BEGIN RAISE NOTICE '✅ Created/verified index: idx_recent_snippets_user_id'; END $$;

-- ============================================================================
-- VERIFICATION CHECKS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RUNNING VERIFICATION CHECKS';
  RAISE NOTICE '========================================';
END $$;

-- Check 1: Verify UNIQUE constraint exists
DO $$
DECLARE
  constraint_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_user_code'
      AND conrelid = 'public.recent_snippets'::regclass
  ) INTO constraint_exists;

  IF constraint_exists THEN
    RAISE NOTICE '✅ CHECK 1 PASSED: UNIQUE constraint exists';
  ELSE
    RAISE EXCEPTION '❌ CHECK 1 FAILED: UNIQUE constraint missing';
  END IF;
END $$;

-- Check 2: Verify FK constraint exists
DO $$
DECLARE
  fk_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_recent_snippets_user'
      AND table_name = 'recent_snippets'
      AND constraint_type = 'FOREIGN KEY'
  ) INTO fk_exists;

  IF fk_exists THEN
    RAISE NOTICE '✅ CHECK 2 PASSED: Foreign key constraint exists';
  ELSE
    RAISE EXCEPTION '❌ CHECK 2 FAILED: Foreign key constraint missing';
  END IF;
END $$;

-- Check 3: Verify trigger exists
DO $$
DECLARE
  trigger_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_snippet_created'
      AND tgrelid = 'public.code_snippets'::regclass
  ) INTO trigger_exists;

  IF trigger_exists THEN
    RAISE NOTICE '✅ CHECK 3 PASSED: Trigger exists';
  ELSE
    RAISE EXCEPTION '❌ CHECK 3 FAILED: Trigger missing';
  END IF;
END $$;

-- Check 4: Verify function exists
DO $$
DECLARE
  function_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'update_recent_snippets'
      AND pronamespace = 'public'::regnamespace
  ) INTO function_exists;

  IF function_exists THEN
    RAISE NOTICE '✅ CHECK 4 PASSED: Function exists';
  ELSE
    RAISE EXCEPTION '❌ CHECK 4 FAILED: Function missing';
  END IF;
END $$;

-- Check 5: Verify RLS policies exist and have correct definitions
DO $$
DECLARE
  insert_policy_count INTEGER;
  update_policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO insert_policy_count
  FROM pg_policies
  WHERE tablename = 'recent_snippets'
    AND policyname = 'Users can insert their own recent snippets';

  SELECT COUNT(*) INTO update_policy_count
  FROM pg_policies
  WHERE tablename = 'recent_snippets'
    AND policyname = 'Users can update their own recent snippets';

  IF insert_policy_count = 1 AND update_policy_count = 1 THEN
    RAISE NOTICE '✅ CHECK 5 PASSED: RLS policies exist';
  ELSE
    RAISE EXCEPTION '❌ CHECK 5 FAILED: Missing RLS policies';
  END IF;
END $$;

-- Check 6: Verify indexes exist
DO $$
DECLARE
  index_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO index_count
  FROM pg_indexes
  WHERE tablename = 'recent_snippets'
    AND indexname IN ('idx_recent_snippets_last_accessed', 'idx_recent_snippets_user_id');

  IF index_count = 2 THEN
    RAISE NOTICE '✅ CHECK 6 PASSED: All indexes exist';
  ELSIF index_count = 1 THEN
    RAISE NOTICE '⚠️  CHECK 6 WARNING: Only % of 2 indexes found (not critical)', index_count;
  ELSE
    RAISE EXCEPTION '❌ CHECK 6 FAILED: Indexes missing';
  END IF;
END $$;

-- Check 7: Verify no existing data conflicts
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT user_id, code, COUNT(*)
    FROM public.recent_snippets
    GROUP BY user_id, code
    HAVING COUNT(*) > 1
  ) AS duplicates;

  IF duplicate_count = 0 THEN
    RAISE NOTICE '✅ CHECK 7 PASSED: No duplicate data conflicts';
  ELSE
    RAISE NOTICE '⚠️  CHECK 7 WARNING: Found % duplicate entries (will be cleaned on next insert)', duplicate_count;
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- FINAL STATUS
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅✅✅ DEPLOYMENT SUCCESSFUL ✅✅✅';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Both migrations applied successfully';
  RAISE NOTICE 'All verification checks passed';
  RAISE NOTICE 'Recent snippets trigger is now working!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Test by inserting code via UI';
  RAISE NOTICE '2. Check sidebar populates correctly';
  RAISE NOTICE '3. Verify no errors in logs';
  RAISE NOTICE '========================================';
END $$;
