# 🔧 URGENT FIX: Recent Snippets Trigger RLS Issue

## 🔴 PROBLEM SUMMARY

The recent_snippets trigger migration **DOES NOT WORK** due to RLS policies blocking the trigger from inserting/updating data.

### What's Happening

1. User submits code
2. Code inserted into `code_snippets` ✅
3. Trigger fires
4. Trigger tries to INSERT into `recent_snippets`
5. **RLS policy blocks the INSERT** ❌
6. Trigger fails silently
7. Sidebar stays empty

### Root Cause

**Two critical issues:**

1. **Missing Foreign Key Constraint**
   - `code_snippets.user_id` has FK to `profiles(id)` ✅
   - `recent_snippets.user_id` has NO FK ❌
   - Result: No referential integrity, no CASCADE delete

2. **RLS Policies Block Trigger**
   - Trigger uses `SECURITY DEFINER` (runs as database owner)
   - In trigger context: `auth.uid()` returns `NULL`
   - RLS INSERT policy requires: `auth.uid() = user_id`
   - Check fails: `NULL = user_id` → **FALSE**
   - **INSERT BLOCKED**

---

## ✅ THE FIX

### Files Created

1. **`supabase/migrations/20251129_fix_recent_snippets_rls.sql`**
   - Adds missing foreign key constraint
   - Fixes RLS policies to allow trigger inserts/updates
   - Adds performance index on `user_id`

2. **`tests/fix-verification.test.sql`**
   - 7 tests to verify fix works
   - Tests trigger insert, ON CONFLICT update, CASCADE delete
   - Validates RLS still protects user data

3. **`BUG_ANALYSIS.md`**
   - Complete root cause analysis
   - Dependency review
   - Technical details

---

## 🚀 HOW TO APPLY THE FIX

### Step 1: Apply Fix Migration

```bash
cd /home/user/metis-clew

# Deploy the fix migration
supabase db push
```

This will apply **two migrations**:
1. `20251129_create_recent_snippets_trigger.sql` (if not already applied)
2. `20251129_fix_recent_snippets_rls.sql` (the fix)

### Step 2: Verify Fix Worked

**Option A: Run Test Suite**
```bash
# Open Supabase SQL Editor
# https://app.supabase.com/project/_/sql/new

# Copy/paste contents of:
# tests/fix-verification.test.sql

# Run and verify:
# ✅ ALL FIX VERIFICATION TESTS PASSED
```

**Option B: Manual Test (via App)**
```bash
# Start dev server
npm run dev

# Navigate to http://localhost:8080

# Test:
1. Paste code and click SUBMIT CODE
2. Check sidebar "RECENT" section
3. Should show your snippet ✅
4. Submit same code again
5. Verify only 1 entry (not duplicated) ✅
```

### Step 3: Verify Database Changes

```sql
-- Check foreign key exists
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'recent_snippets'
  AND constraint_name = 'fk_recent_snippets_user';
-- Expected: 1 row (FOREIGN KEY)

-- Check RLS policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'recent_snippets';
-- Expected: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- INSERT and UPDATE should allow auth.uid() IS NULL

-- Test trigger manually
INSERT INTO code_snippets (user_id, code, language)
VALUES ('YOUR_USER_ID', 'test code', 'python');

SELECT * FROM recent_snippets WHERE user_id = 'YOUR_USER_ID';
-- Expected: 1 row with your test code
```

---

## 🔍 WHAT THE FIX DOES

### Change 1: Add Foreign Key Constraint

**Before:**
```sql
user_id uuid NOT NULL
```

**After:**
```sql
user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE
```

**Benefits:**
- ✅ Referential integrity enforced
- ✅ Orphaned records prevented
- ✅ CASCADE delete when user deleted
- ✅ Database-level validation

### Change 2: Fix RLS INSERT Policy

**Before:**
```sql
CREATE POLICY "Users can insert their own recent snippets"
ON public.recent_snippets FOR INSERT
WITH CHECK (auth.uid() = user_id);
-- Blocks trigger! auth.uid() is NULL in SECURITY DEFINER context
```

**After:**
```sql
CREATE POLICY "Users can insert their own recent snippets"
ON public.recent_snippets FOR INSERT
WITH CHECK (
  auth.uid() = user_id  -- Normal user inserts
  OR
  auth.uid() IS NULL    -- Trigger inserts (SECURITY DEFINER)
);
```

**Security:**
- ✅ Still blocks users from inserting other users' data
- ✅ Only allows NULL auth in trigger context
- ✅ Regular users always have auth.uid() set (not NULL)

### Change 3: Fix RLS UPDATE Policy

**Before:**
```sql
CREATE POLICY "Users can update their own recent snippets"
ON public.recent_snippets FOR UPDATE
USING (auth.uid() = user_id);
-- Blocks ON CONFLICT DO UPDATE!
```

**After:**
```sql
CREATE POLICY "Users can update their own recent snippets"
ON public.recent_snippets FOR UPDATE
USING (
  auth.uid() = user_id  -- Normal user updates
  OR
  auth.uid() IS NULL    -- Trigger updates (ON CONFLICT DO UPDATE)
);
```

### Change 4: Add Performance Index

```sql
CREATE INDEX IF NOT EXISTS idx_recent_snippets_user_id
ON public.recent_snippets (user_id);
```

**Benefits:**
- ✅ Faster FK constraint checks
- ✅ Faster CASCADE delete operations
- ✅ Better query performance with FK joins

---

## 🧪 TESTING

### Test Coverage

**7 tests verify:**

1. ✅ Foreign key constraint exists
2. ✅ Trigger can insert (RLS not blocking)
3. ✅ Trigger can update on conflict (ON CONFLICT works)
4. ✅ CASCADE delete works (FK enforced)
5. ✅ RLS still protects user data (security maintained)
6. ✅ Updated RLS policies exist
7. ✅ Performance index exists

### Expected Results

**All tests should PASS:**
```
TEST 1: ✅ Foreign key constraint exists
TEST 2: ✅ Trigger successfully inserted into recent_snippets
TEST 3: ✅ Trigger successfully updated via ON CONFLICT
TEST 4: ✅ CASCADE delete works (before: 1, after: 0)
TEST 5: ✅ User2 data exists. RLS will block in app context.
TEST 6: ✅ RLS policies exist
TEST 7: ✅ user_id index exists
```

---

## 🔄 ROLLBACK (If Needed)

### If Fix Migration Fails

```sql
-- Remove foreign key
ALTER TABLE public.recent_snippets
DROP CONSTRAINT IF EXISTS fk_recent_snippets_user;

-- Restore original RLS policies
DROP POLICY IF EXISTS "Users can insert their own recent snippets" ON public.recent_snippets;
DROP POLICY IF EXISTS "Users can update their own recent snippets" ON public.recent_snippets;

CREATE POLICY "Users can insert their own recent snippets"
ON public.recent_snippets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recent snippets"
ON public.recent_snippets FOR UPDATE
USING (auth.uid() = user_id);

-- Remove index
DROP INDEX IF EXISTS idx_recent_snippets_user_id;
```

---

## ❓ WHY WAS THIS MISSED?

### Analysis Error in Original Audit

**What was checked:** ✅
- SQL syntax
- Table/column existence
- No FK violations (because no FK!)
- Basic RLS policies

**What was MISSED:** ❌
- RLS policy interaction with `SECURITY DEFINER`
- Missing foreign key constraint validation
- Trigger execution context testing
- auth.uid() behavior in trigger functions

### Lesson Learned

**For future migrations:**
1. ✅ Always test RLS with `SECURITY DEFINER` functions
2. ✅ Verify ALL foreign key constraints (not just existence)
3. ✅ Test trigger execution in database context
4. ✅ Check auth.uid() behavior in different contexts
5. ✅ Run integration tests BEFORE production deployment

---

## 📋 POST-DEPLOYMENT CHECKLIST

After applying fix:

- [ ] Migration applied successfully (no errors)
- [ ] Foreign key constraint exists
- [ ] RLS policies updated
- [ ] Test suite passes (all 7 tests)
- [ ] Manual test: Submit code via UI
- [ ] Sidebar shows recent snippets ✅
- [ ] Duplicate code updates timestamp (no duplicate entries)
- [ ] No errors in Supabase logs

---

## 🎯 DEPENDENCIES FIXED

### 1. Foreign Key Relationship

**Before:** ❌ No FK constraint
```
code_snippets.user_id → profiles.id (FK exists)
recent_snippets.user_id → ??? (NO FK!)
```

**After:** ✅ FK constraint added
```
code_snippets.user_id → profiles.id (FK exists)
recent_snippets.user_id → profiles.id (FK added)
```

### 2. RLS Policy Interaction

**Before:** ❌ Blocks trigger
- Trigger uses SECURITY DEFINER
- auth.uid() returns NULL
- Policy checks NULL = user_id → FALSE
- INSERT/UPDATE blocked

**After:** ✅ Allows trigger
- Policy allows auth.uid() IS NULL
- Trigger can insert/update
- Regular users still protected (auth.uid() never NULL for users)

### 3. CASCADE Delete Behavior

**Before:** ❌ Orphaned records
- User deleted from profiles
- code_snippets CASCADE deleted ✅
- recent_snippets NOT deleted (orphaned) ❌

**After:** ✅ Proper cleanup
- User deleted from profiles
- code_snippets CASCADE deleted ✅
- recent_snippets CASCADE deleted ✅

---

## 🚨 CRITICAL: Security Review

### Is allowing `auth.uid() IS NULL` safe?

**YES** - Here's why:

1. **Only triggers have auth.uid() = NULL**
   - SECURITY DEFINER functions run without user context
   - Regular user sessions ALWAYS have auth.uid() set

2. **Trigger only inserts user's own data**
   - Trigger uses `NEW.user_id` from code_snippets
   - code_snippets has RLS: user can only insert their own data
   - Therefore, trigger only populates recent_snippets with user's own data

3. **No security bypass for end users**
   - Users cannot set auth.uid() to NULL
   - Users cannot execute SECURITY DEFINER functions directly
   - RLS still enforces user_id matching for regular queries

4. **Matches existing patterns**
   - `handle_new_user()` trigger uses same pattern
   - `handle_updated_at()` trigger uses same pattern
   - This is standard Supabase/PostgreSQL practice

**Verdict:** ✅ **SAFE** - No security risk introduced

---

## 📝 SUMMARY

**Problem:** Trigger blocked by RLS, missing FK constraint

**Fix:** Updated RLS policies, added FK constraint

**Status:** ✅ **READY TO DEPLOY**

**Risk:** 🟢 **LOW** (only fixes broken feature, no breaking changes)

**Files:**
- `supabase/migrations/20251129_fix_recent_snippets_rls.sql`
- `tests/fix-verification.test.sql`
- `BUG_ANALYSIS.md`

**Next Steps:**
1. Run `supabase db push`
2. Run tests from `tests/fix-verification.test.sql`
3. Test in app UI
4. Verify sidebar works ✅

---

**END OF FIX DEPLOYMENT GUIDE**
