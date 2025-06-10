-- Fix Database Relationships for Admin Queries
-- Run this SQL in Supabase SQL Editor to fix relationship issues

-- ============================================================================
-- STEP 1: Add proper foreign key relationships to profiles table
-- ============================================================================

-- Add foreign key constraints to link tables properly with profiles
-- This allows Supabase to understand the relationships for joins

-- For ibadah_records table - add foreign key to profiles
ALTER TABLE public.ibadah_records 
DROP CONSTRAINT IF EXISTS ibadah_records_user_profile_fkey;

ALTER TABLE public.ibadah_records 
ADD CONSTRAINT ibadah_records_user_profile_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- For support_messages table - add foreign key to profiles  
ALTER TABLE public.support_messages 
DROP CONSTRAINT IF EXISTS support_messages_user_profile_fkey;

ALTER TABLE public.support_messages 
ADD CONSTRAINT support_messages_user_profile_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- For user_ibadah table - add foreign key to profiles
ALTER TABLE public.user_ibadah 
DROP CONSTRAINT IF EXISTS user_ibadah_user_profile_fkey;

ALTER TABLE public.user_ibadah 
ADD CONSTRAINT user_ibadah_user_profile_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- For muhasabah_entries table - add foreign key to profiles
ALTER TABLE public.muhasabah_entries 
DROP CONSTRAINT IF EXISTS muhasabah_entries_user_profile_fkey;

ALTER TABLE public.muhasabah_entries 
ADD CONSTRAINT muhasabah_entries_user_profile_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 2: Create views for easier admin queries (alternative approach)
-- ============================================================================

-- Create a view that joins ibadah_records with profiles
CREATE OR REPLACE VIEW public.ibadah_records_with_profiles AS
SELECT 
    ir.*,
    p.full_name,
    p.email,
    p.is_admin
FROM public.ibadah_records ir
LEFT JOIN public.profiles p ON ir.user_id = p.id;

-- Create a view that joins support_messages with profiles
CREATE OR REPLACE VIEW public.support_messages_with_profiles AS
SELECT 
    sm.*,
    p.full_name,
    p.email,
    p.is_admin
FROM public.support_messages sm
LEFT JOIN public.profiles p ON sm.user_id = p.id;

-- Grant access to views for authenticated users
GRANT SELECT ON public.ibadah_records_with_profiles TO authenticated;
GRANT SELECT ON public.support_messages_with_profiles TO authenticated;

-- ============================================================================
-- STEP 3: Enable RLS on views and create policies
-- ============================================================================

-- Enable RLS on views
ALTER VIEW public.ibadah_records_with_profiles SET (security_invoker = true);
ALTER VIEW public.support_messages_with_profiles SET (security_invoker = true);

-- ============================================================================
-- STEP 4: Update the handle_new_user function to ensure profile creation
-- ============================================================================

-- Update handle_new_user function to ensure profiles are created properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into profiles table
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
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        last_sign_in_at = EXCLUDED.last_sign_in_at,
        email_confirmed_at = EXCLUDED.email_confirmed_at;
    
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
    WHERE it.is_default = true AND it.is_ramadhan_only = false
    ON CONFLICT (user_id, ibadah_type_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: Refresh schema cache
-- ============================================================================

-- Refresh the schema cache to recognize new relationships
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- STEP 6: Verify relationships
-- ============================================================================

-- Check foreign key constraints
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
    AND (tc.table_name IN ('ibadah_records', 'support_messages', 'user_ibadah', 'muhasabah_entries'))
ORDER BY tc.table_name, kcu.column_name;
