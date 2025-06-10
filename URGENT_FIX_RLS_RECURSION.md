# 🚨 URGENT: Fix RLS Infinite Recursion Error

## Problem
The dashboard is showing this error:
```
Failed to load dashboard data: Dashboard data fetch failed: infinite recursion detected in policy for relation "profiles"
```

## Root Cause
The RLS policies for the `profiles` table are creating infinite recursion because admin policies are trying to query the `profiles` table from within policies on the same table.

## Immediate Fix Required

### Step 1: Run the SQL Fix
Go to your Supabase Dashboard → SQL Editor and run the contents of `fix-profiles-rls-recursion.sql`:

```sql
-- Fix Profiles RLS Infinite Recursion Issue

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- Create simple, non-recursive policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies using the function
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.is_admin_user(auth.uid()));

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO authenticated;
```

### Step 2: Verify Fix
After running the SQL:
1. Refresh your browser
2. Try accessing the dashboard
3. The infinite recursion error should be resolved

## What This Fix Does

1. **Removes Recursive Policies**: Drops all existing policies that cause recursion
2. **Creates Safe Policies**: New policies that don't reference the same table
3. **Uses Security Definer Function**: The `is_admin_user()` function bypasses RLS when checking admin status
4. **Maintains Security**: Users can still only access their own data, admins can access all data

## Alternative Quick Fix (If SQL Access Not Available)

If you can't access Supabase SQL Editor immediately, you can temporarily disable RLS on profiles:

```sql
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
```

**⚠️ WARNING**: This removes all security on the profiles table. Only use as a temporary measure and re-enable RLS after applying the proper fix.

## Testing After Fix

1. Dashboard should load without errors
2. Regular users should see their own profile data
3. Admin users should be able to access admin features
4. No infinite recursion errors in console

## Files Modified
- `fix-profiles-rls-recursion.sql` (new file with the fix)
- Enhanced error handling in `src/lib/supabase/database.ts`

## Next Steps
After applying this fix, the dashboard should work properly and you can continue with normal development.
