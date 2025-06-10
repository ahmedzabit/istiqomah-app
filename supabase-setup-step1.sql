-- ISTIQOMAH Database Setup - Step 1: Create Tables
-- Run this first in your Supabase SQL Editor

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ibadah_types table
CREATE TABLE IF NOT EXISTS public.ibadah_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    tracking_type TEXT CHECK (tracking_type IN ('checklist', 'count')) NOT NULL,
    frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly')) DEFAULT 'daily',
    is_default BOOLEAN DEFAULT FALSE,
    is_ramadhan_only BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_ibadah table
CREATE TABLE IF NOT EXISTS public.user_ibadah (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    ibadah_type_id UUID REFERENCES public.ibadah_types ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    target_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, ibadah_type_id)
);

-- Create ibadah_records table
CREATE TABLE IF NOT EXISTS public.ibadah_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    ibadah_type_id UUID REFERENCES public.ibadah_types ON DELETE CASCADE,
    date DATE NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    count_value INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, ibadah_type_id, date)
);

-- Create support_messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT DEFAULT 'other',
    status TEXT CHECK (status IN ('open', 'in_progress', 'closed')) DEFAULT 'open',
    admin_reply TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ramadhan_content table
CREATE TABLE IF NOT EXISTS public.ramadhan_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    ayat TEXT,
    hadis TEXT,
    tips TEXT,
    doa TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create muhasabah_entries table
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
