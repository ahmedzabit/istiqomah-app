-- Simple Support Messages Fix
-- Run this SQL in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Ensure support_messages table exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT DEFAULT 'other',
    status TEXT CHECK (status IN ('open', 'in_progress', 'closed')) DEFAULT 'open',
    admin_reply TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: Enable RLS and create simple policies
-- ============================================================================

-- Enable RLS
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own messages" ON public.support_messages;
DROP POLICY IF EXISTS "Users can create messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can view all support messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins can update support messages" ON public.support_messages;

-- Create simple policies
CREATE POLICY "Users can view own messages" ON public.support_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create messages" ON public.support_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin policies - using simple approach
CREATE POLICY "Admins can view all support messages" ON public.support_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can update support messages" ON public.support_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- ============================================================================
-- STEP 3: Create updated_at trigger
-- ============================================================================

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_support_messages_updated_at ON public.support_messages;
CREATE TRIGGER update_support_messages_updated_at 
    BEFORE UPDATE ON public.support_messages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STEP 4: Insert sample data for testing
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
        
        INSERT INTO public.support_messages (user_id, subject, message, category, status)
        VALUES (
            sample_user_id,
            'Another Test Message',
            'This is another test message with different status.',
            'bug',
            'in_progress'
        );
    END IF;
END $$;

-- ============================================================================
-- STEP 5: Verify the setup
-- ============================================================================

-- Check if table exists and has data
SELECT 
    'support_messages table' as table_name,
    COUNT(*) as row_count 
FROM public.support_messages;

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'support_messages' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'support_messages' 
ORDER BY policyname;
