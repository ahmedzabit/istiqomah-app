-- Fix Admin Dashboard Access Issues
-- Run this SQL in Supabase SQL Editor to fix admin dashboard errors

-- ============================================================================
-- STEP 1: Ensure admin policies exist for profiles table
-- ============================================================================

-- Drop existing admin policies to recreate them
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- Create function to check admin status (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Use security definer to bypass RLS when checking admin status
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO authenticated;

-- Create admin policies using the function
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.is_admin_user(auth.uid()));

-- ============================================================================
-- STEP 2: Ensure admin policies exist for other tables
-- ============================================================================

-- Admin policies for ibadah_records
DROP POLICY IF EXISTS "Admins can view all ibadah records" ON public.ibadah_records;
CREATE POLICY "Admins can view all ibadah records" ON public.ibadah_records
    FOR SELECT USING (public.is_admin_user(auth.uid()));

-- Admin policies for support_messages
DROP POLICY IF EXISTS "Admins can view all support messages" ON public.support_messages;
CREATE POLICY "Admins can view all support messages" ON public.support_messages
    FOR SELECT USING (public.is_admin_user(auth.uid()));

DROP POLICY IF EXISTS "Admins can update support messages" ON public.support_messages;
CREATE POLICY "Admins can update support messages" ON public.support_messages
    FOR UPDATE USING (public.is_admin_user(auth.uid()));

-- Admin policies for user_ibadah
DROP POLICY IF EXISTS "Admins can view all user ibadah" ON public.user_ibadah;
CREATE POLICY "Admins can view all user ibadah" ON public.user_ibadah
    FOR SELECT USING (public.is_admin_user(auth.uid()));

-- Admin policies for muhasabah_entries
DROP POLICY IF EXISTS "Admins can view all muhasabah entries" ON public.muhasabah_entries;
CREATE POLICY "Admins can view all muhasabah entries" ON public.muhasabah_entries
    FOR SELECT USING (public.is_admin_user(auth.uid()));

-- ============================================================================
-- STEP 3: Create a test admin user (if needed)
-- ============================================================================

-- Check if there are any admin users
DO $$
DECLARE
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM public.profiles WHERE is_admin = true;
    
    IF admin_count = 0 THEN
        RAISE NOTICE 'No admin users found. You need to manually set is_admin = true for at least one user.';
        RAISE NOTICE 'Run this query after creating a user account:';
        RAISE NOTICE 'UPDATE public.profiles SET is_admin = true WHERE email = ''your-admin-email@example.com'';';
    ELSE
        RAISE NOTICE 'Found % admin user(s)', admin_count;
    END IF;
END $$;

-- ============================================================================
-- STEP 4: Verify policies are working
-- ============================================================================

-- List all policies for profiles table
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;

-- Test admin function (this should return true for admin users)
-- SELECT public.is_admin_user(auth.uid());

-- Final success message
DO $$
BEGIN
    RAISE NOTICE 'Admin dashboard access policies have been updated successfully!';
    RAISE NOTICE 'Make sure you have at least one user with is_admin = true in the profiles table.';
END $$;
