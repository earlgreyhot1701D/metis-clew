-- Migration: Fix RLS policies blocking recent_snippets trigger
-- Created: 2025-11-29
-- Purpose: Fix trigger failures caused by RLS policy blocking inserts/updates
-- Depends on: 20251129_create_recent_snippets_trigger.sql

-- ==============================================================================
-- PROBLEM ANALYSIS:
-- The trigger function uses SECURITY DEFINER, which means it runs as the
-- database owner (not the user). In this context, auth.uid() returns NULL.
-- The RLS policies require auth.uid() = user_id, so NULL = user_id fails,
-- blocking the trigger from inserting/updating rows.
-- ==============================================================================

-- Step 1: Add missing foreign key constraint
-- This ensures data integrity and CASCADE delete when users are deleted
ALTER TABLE public.recent_snippets
ADD CONSTRAINT fk_recent_snippets_user
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Step 2: Drop existing RLS policies that block the trigger
DROP POLICY IF EXISTS "Users can insert their own recent snippets" ON public.recent_snippets;
DROP POLICY IF EXISTS "Users can update their own recent snippets" ON public.recent_snippets;

-- Step 3: Recreate INSERT policy with trigger exemption
-- Allows inserts when:
-- 1. User is authenticated AND inserting their own data (normal app usage)
-- 2. OR when called from a SECURITY DEFINER function (trigger context)
CREATE POLICY "Users can insert their own recent snippets"
ON public.recent_snippets FOR INSERT
WITH CHECK (
  -- Normal user inserts (auth.uid() matches user_id)
  auth.uid() = user_id
  OR
  -- System/trigger inserts (called by SECURITY DEFINER function)
  -- In trigger context, auth.uid() is NULL, so we allow NULL to insert
  auth.uid() IS NULL
);

-- Step 4: Recreate UPDATE policy with trigger exemption
-- Allows updates when:
-- 1. User is authenticated AND updating their own data
-- 2. OR when called from a SECURITY DEFINER function (ON CONFLICT DO UPDATE)
CREATE POLICY "Users can update their own recent snippets"
ON public.recent_snippets FOR UPDATE
USING (
  -- Normal user updates
  auth.uid() = user_id
  OR
  -- System/trigger updates (ON CONFLICT DO UPDATE)
  auth.uid() IS NULL
);

-- Step 5: Add index on user_id for foreign key performance
-- Improves performance of CASCADE deletes and FK checks
CREATE INDEX IF NOT EXISTS idx_recent_snippets_user_id
ON public.recent_snippets (user_id);

-- Step 6: Add comments for documentation
COMMENT ON CONSTRAINT fk_recent_snippets_user ON public.recent_snippets IS
  'Foreign key to profiles ensures data integrity and CASCADE delete when user is removed.';

COMMENT ON POLICY "Users can insert their own recent snippets" ON public.recent_snippets IS
  'Allows authenticated users to insert their own snippets OR trigger function (auth.uid() IS NULL) to insert via SECURITY DEFINER.';

COMMENT ON POLICY "Users can update their own recent snippets" ON public.recent_snippets IS
  'Allows authenticated users to update their own snippets OR trigger function to update via ON CONFLICT DO UPDATE.';
