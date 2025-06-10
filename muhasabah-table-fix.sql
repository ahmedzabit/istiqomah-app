-- Fix Muhasabah Table - Run this if muhasabah save is failing
-- This script ensures the muhasabah_entries table exists with proper structure

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create muhasabah_entries table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.muhasabah_entries (
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

-- Enable RLS
ALTER TABLE public.muhasabah_entries ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own entries
DROP POLICY IF EXISTS "Users can manage own muhasabah entries" ON public.muhasabah_entries;
CREATE POLICY "Users can manage own muhasabah entries" ON public.muhasabah_entries
    FOR ALL USING (auth.uid() = user_id);

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_muhasabah_entries_updated_at ON public.muhasabah_entries;
CREATE TRIGGER update_muhasabah_entries_updated_at
    BEFORE UPDATE ON public.muhasabah_entries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Verify table exists
SELECT 'Muhasabah table created successfully!' as status;
