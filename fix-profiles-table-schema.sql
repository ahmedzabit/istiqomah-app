-- Fix Profiles Table Schema Issues
-- Run this SQL in Supabase SQL Editor to fix missing columns and RLS issues

-- ============================================================================
-- STEP 1: Add missing columns to profiles table
-- ============================================================================

-- Add last_sign_in_at column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMP WITH TIME ZONE;

-- Add email_confirmed_at column if it doesn't exist (useful for admin)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email_confirmed_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- STEP 2: Create function to sync auth data with profiles
-- ============================================================================

-- Function to sync auth.users data with profiles table
CREATE OR REPLACE FUNCTION public.sync_auth_data_to_profiles()
RETURNS VOID AS $$
BEGIN
    -- Update existing profiles with auth data
    UPDATE public.profiles 
    SET 
        last_sign_in_at = auth_users.last_sign_in_at,
        email_confirmed_at = auth_users.email_confirmed_at,
        email = auth_users.email
    FROM auth.users auth_users
    WHERE profiles.id = auth_users.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: Fix RLS policies (remove recursion)
-- ============================================================================

-- Drop all existing policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- Create simple, non-recursive policies for profiles table
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
    -- Use security definer to bypass RLS
    RETURN EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = user_id AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin policies using the function (avoids recursion)
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (public.is_admin_user(auth.uid()));

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_auth_data_to_profiles() TO authenticated;

-- ============================================================================
-- STEP 4: Update the user registration function
-- ============================================================================

-- Update handle_new_user function to include auth data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        last_sign_in_at, 
        email_confirmed_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        NEW.last_sign_in_at,
        NEW.email_confirmed_at
    );
    
    -- Add default ibadah for new user (non-Ramadhan only)
    INSERT INTO public.user_ibadah (user_id, ibadah_type_id, target_count)
    SELECT 
        NEW.id,
        it.id,
        CASE 
            WHEN it.tracking_type = 'count' AND it.name = 'Tilawah Al-Quran' THEN 5
            WHEN it.tracking_type = 'count' AND it.name = 'Istighfar' THEN 100
            WHEN it.tracking_type = 'count' AND it.name = 'Tadarus Al-Quran' THEN 1
            WHEN it.tracking_type = 'count' AND it.name = 'Sedekah Ramadhan' THEN 1
            ELSE 1
        END
    FROM public.ibadah_types it
    WHERE it.is_default = true AND it.is_ramadhan_only = false;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: Sync existing data
-- ============================================================================

-- Run the sync function to update existing profiles
SELECT public.sync_auth_data_to_profiles();

-- ============================================================================
-- STEP 6: Verify the fix
-- ============================================================================

-- Check if columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles' 
ORDER BY policyname;
