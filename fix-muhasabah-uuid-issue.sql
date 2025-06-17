-- Fix for Muhasabah UUID Issue
-- Run this script in Supabase SQL Editor if you get "null value in column id" error

-- ============================================================================
-- STEP 1: Enable UUID Extension
-- ============================================================================

-- Enable the UUID extension (required for uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- STEP 2: Backup existing data (if any)
-- ============================================================================

-- Create a backup table for existing muhasabah data
CREATE TABLE IF NOT EXISTS muhasabah_entries_backup AS 
SELECT * FROM public.muhasabah_entries WHERE 1=0; -- Empty structure

-- Copy existing data to backup (if table exists and has data)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'muhasabah_entries') THEN
        INSERT INTO muhasabah_entries_backup 
        SELECT * FROM public.muhasabah_entries WHERE id IS NOT NULL;
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Drop and recreate the table with correct UUID generation
-- ============================================================================

-- Drop the problematic table
DROP TABLE IF EXISTS public.muhasabah_entries;

-- Create the table with proper UUID generation
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
-- STEP 4: Restore backed up data (if any)
-- ============================================================================

-- Restore data from backup, generating new UUIDs for entries without them
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'muhasabah_entries_backup') THEN
        INSERT INTO public.muhasabah_entries (user_id, date, good_things, improvements, prayers_hopes, mood, created_at, updated_at)
        SELECT user_id, date, good_things, improvements, prayers_hopes, mood, created_at, updated_at
        FROM muhasabah_entries_backup;
    END IF;
END $$;

-- ============================================================================
-- STEP 5: Set up Row Level Security
-- ============================================================================

-- Enable RLS
ALTER TABLE public.muhasabah_entries ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Users can manage own muhasabah entries" ON public.muhasabah_entries
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- STEP 6: Create update trigger
-- ============================================================================

-- Create trigger for updated_at column (if update function exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_muhasabah_entries_updated_at 
            BEFORE UPDATE ON public.muhasabah_entries
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- ============================================================================
-- STEP 7: Clean up backup table
-- ============================================================================

-- Drop the backup table (uncomment if you want to keep it)
-- DROP TABLE IF EXISTS muhasabah_entries_backup;

-- ============================================================================
-- STEP 8: Verification
-- ============================================================================

-- Test UUID generation
DO $$
DECLARE
    test_uuid UUID;
BEGIN
    SELECT uuid_generate_v4() INTO test_uuid;
    RAISE NOTICE 'UUID generation test: %', test_uuid;
END $$;

-- Check table structure
SELECT 
    column_name, 
    data_type, 
    column_default, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'muhasabah_entries' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'muhasabah_entries';

-- Check policies
SELECT 
    policyname, 
    permissive, 
    roles, 
    cmd 
FROM pg_policies 
WHERE tablename = 'muhasabah_entries';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

SELECT 'Muhasabah table UUID issue has been fixed! You can now use the muhasabah feature.' as status;

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- If you still get UUID errors, try this manual test:
-- INSERT INTO public.muhasabah_entries (user_id, date, good_things, improvements, prayers_hopes) 
-- VALUES (auth.uid(), CURRENT_DATE, 'Test', 'Test', 'Test');

-- If the above fails, the issue might be:
-- 1. UUID extension not properly enabled
-- 2. Permissions issue
-- 3. RLS policy blocking the insert

-- To check UUID extension:
-- SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';

-- To check table structure (instead of \d command):
-- SELECT column_name, data_type, column_default FROM information_schema.columns
-- WHERE table_name = 'muhasabah_entries' ORDER BY ordinal_position;

-- To manually generate UUID in app code instead of relying on database default:
-- Use crypto.randomUUID() in JavaScript before inserting
