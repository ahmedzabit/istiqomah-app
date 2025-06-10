-- ISTIQOMAH Database Setup - Step 2: Enable RLS and Create Policies
-- Run this after Step 1 is completed

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ibadah_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ibadah ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ibadah_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ramadhan_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.muhasabah_entries ENABLE ROW LEVEL SECURITY;

-- Policies for profiles table
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policies for ibadah_types table
CREATE POLICY "Users can view all ibadah types" ON public.ibadah_types
    FOR SELECT USING (true);

CREATE POLICY "Users can create custom ibadah types" ON public.ibadah_types
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own ibadah types" ON public.ibadah_types
    FOR UPDATE USING (auth.uid() = created_by OR is_default = true);

-- Policies for user_ibadah table
CREATE POLICY "Users can manage own ibadah" ON public.user_ibadah
    FOR ALL USING (auth.uid() = user_id);

-- Policies for ibadah_records table
CREATE POLICY "Users can manage own records" ON public.ibadah_records
    FOR ALL USING (auth.uid() = user_id);

-- Policies for support_messages table
CREATE POLICY "Users can view own messages" ON public.support_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create messages" ON public.support_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for ramadhan_content table (readable by all authenticated users)
CREATE POLICY "Authenticated users can view ramadhan content" ON public.ramadhan_content
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policies for muhasabah_entries table
CREATE POLICY "Users can manage own muhasabah entries" ON public.muhasabah_entries
    FOR ALL USING (auth.uid() = user_id);
