-- Fix Support Messages Table and Permissions
-- Run this SQL in Supabase SQL Editor to ensure support_messages table works properly

-- ============================================================================
-- STEP 1: Ensure support_messages table exists with proper structure
-- ============================================================================

-- Create support_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT DEFAULT 'other',
    status TEXT CHECK (status IN ('open', 'in_progress', 'closed')) DEFAULT 'open',
    admin_reply TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: Add proper foreign key constraints
-- ============================================================================

-- Add foreign key to auth.users (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'support_messages_user_id_fkey' 
        AND table_name = 'support_messages'
    ) THEN
        ALTER TABLE public.support_messages 
        ADD CONSTRAINT support_messages_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add foreign key to profiles (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'support_messages_user_profile_fkey' 
        AND table_name = 'support_messages'
    ) THEN
        ALTER TABLE public.support_messages 
        ADD CONSTRAINT support_messages_user_profile_fkey 
        FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Enable RLS and create policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own messages" ON public.support_messages;
DROP POLICY IF EXISTS "Users can create messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can view all support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can update support messages" ON public.support_messages;

-- Create user policies
CREATE POLICY "Users can view own messages" ON public.support_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create messages" ON public.support_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create admin policies using the safe function
CREATE POLICY "Admins can view all support messages" ON public.support_messages
    FOR SELECT USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can update support messages" ON public.support_messages
    FOR UPDATE USING (public.is_admin_user(auth.uid()));

-- ============================================================================
-- STEP 4: Create updated_at trigger
-- ============================================================================

-- Create trigger for updated_at if it doesn't exist
DROP TRIGGER IF EXISTS update_support_messages_updated_at ON public.support_messages;
CREATE TRIGGER update_support_messages_updated_at 
    BEFORE UPDATE ON public.support_messages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 5: Create view for easier admin queries
-- ============================================================================

-- Create view that joins support_messages with profiles
CREATE OR REPLACE VIEW public.support_messages_with_profiles AS
SELECT 
    sm.*,
    p.full_name,
    p.email,
    p.is_admin
FROM public.support_messages sm
LEFT JOIN public.profiles p ON sm.user_id = p.id;

-- Grant access to view
GRANT SELECT ON public.support_messages_with_profiles TO authenticated;

-- Enable RLS on view
ALTER VIEW public.support_messages_with_profiles SET (security_invoker = true);

-- ============================================================================
-- STEP 6: Insert sample data for testing (optional)
-- ============================================================================

-- Insert a sample support message for testing (only if table is empty)
DO $$
DECLARE
    sample_user_id UUID;
BEGIN
    -- Get a sample user ID from profiles
    SELECT id INTO sample_user_id FROM public.profiles LIMIT 1;
    
    -- Insert sample message if user exists and table is empty
    IF sample_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.support_messages LIMIT 1) THEN
        INSERT INTO public.support_messages (user_id, subject, message, category, status)
        VALUES (
            sample_user_id,
            'Test Support Message',
            'This is a test support message to verify the table is working properly.',
            'other',
            'open'
        );
    END IF;
END $$;

-- ============================================================================
-- STEP 7: Verify the setup
-- ============================================================================

-- Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'support_messages' AND table_schema = 'public'
ORDER BY ordinal_position;

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
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'support_messages'
    AND tc.table_schema = 'public';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'support_messages' 
ORDER BY policyname;

-- Check if view exists
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name = 'support_messages_with_profiles' 
    AND table_schema = 'public';

-- Test basic query (should work for admins)
SELECT COUNT(*) as total_messages FROM public.support_messages;
