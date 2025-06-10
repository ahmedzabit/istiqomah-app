-- ISTIQOMAH Database Migration: Muhasabah Feature
-- Run this script in your Supabase SQL Editor to add muhasabah functionality
-- This is for EXISTING databases that already have the basic ISTIQOMAH setup

-- ============================================================================
-- 0. ENSURE UUID EXTENSION IS ENABLED
-- ============================================================================

-- Enable UUID extension (should already be enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. CREATE MUHASABAH_ENTRIES TABLE
-- ============================================================================

-- Drop table if it exists with issues and recreate
DROP TABLE IF EXISTS public.muhasabah_entries;

-- Create muhasabah_entries table with proper UUID generation
CREATE TABLE public.muhasabah_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    date DATE NOT NULL,
    good_things TEXT NOT NULL,
    improvements TEXT NOT NULL,
    prayers_hopes TEXT NOT NULL,
    mood VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- ============================================================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on muhasabah_entries
ALTER TABLE public.muhasabah_entries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. CREATE RLS POLICIES
-- ============================================================================

-- Create policies for muhasabah_entries
CREATE POLICY "Users can manage own muhasabah entries" ON public.muhasabah_entries
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 4. CREATE UPDATE TRIGGER
-- ============================================================================

-- Create trigger for updated_at timestamp
-- Note: This assumes the update_updated_at_column() function already exists
-- If it doesn't exist, uncomment the function creation below

/*
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
*/

-- Create the trigger
CREATE TRIGGER update_muhasabah_entries_updated_at 
    BEFORE UPDATE ON public.muhasabah_entries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- 5. VERIFICATION QUERIES
-- ============================================================================

-- Check if table was created successfully
SELECT 
    table_name, 
    table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name = 'muhasabah_entries';

-- Check if RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'muhasabah_entries';

-- Check if policies exist
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual 
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'muhasabah_entries';

-- Check if trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    action_timing, 
    action_statement 
FROM information_schema.triggers 
WHERE event_object_table = 'muhasabah_entries';

-- ============================================================================
-- 6. TEST INSERT (OPTIONAL)
-- ============================================================================

-- Uncomment and modify this to test the table with your user ID
-- Replace 'your-user-id-here' with an actual user ID from auth.users

/*
INSERT INTO public.muhasabah_entries (
    user_id, 
    date, 
    good_things, 
    improvements, 
    prayers_hopes, 
    mood
) VALUES (
    'your-user-id-here',
    CURRENT_DATE,
    'Test good things',
    'Test improvements',
    'Test prayers and hopes',
    'happy'
);

-- Check if the test insert worked
SELECT * FROM public.muhasabah_entries WHERE date = CURRENT_DATE;

-- Clean up test data
DELETE FROM public.muhasabah_entries WHERE good_things = 'Test good things';
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- If all queries above return expected results, the migration was successful!
-- You can now use the muhasabah features in the ISTIQOMAH app.

-- Expected results:
-- 1. Table 'muhasabah_entries' should exist
-- 2. RLS should be enabled (rowsecurity = true)
-- 3. Policy "Users can manage own muhasabah entries" should exist
-- 4. Trigger "update_muhasabah_entries_updated_at" should exist

SELECT 'Muhasabah migration completed successfully!' as status;
