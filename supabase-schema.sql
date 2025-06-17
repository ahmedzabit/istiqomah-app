-- ISTIQOMAH Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Note: RLS is automatically enabled by Supabase, no need to set JWT secret manually

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

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

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

-- Enable RLS on ibadah_types
ALTER TABLE public.ibadah_types ENABLE ROW LEVEL SECURITY;

-- Create policies for ibadah_types
CREATE POLICY "Users can view all ibadah types" ON public.ibadah_types
    FOR SELECT USING (true);

CREATE POLICY "Users can create custom ibadah types" ON public.ibadah_types
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update own ibadah types" ON public.ibadah_types
    FOR UPDATE USING (auth.uid() = created_by OR is_default = true);

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

-- Enable RLS on user_ibadah
ALTER TABLE public.user_ibadah ENABLE ROW LEVEL SECURITY;

-- Create policies for user_ibadah
CREATE POLICY "Users can manage own ibadah" ON public.user_ibadah
    FOR ALL USING (auth.uid() = user_id);

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

-- Enable RLS on ibadah_records
ALTER TABLE public.ibadah_records ENABLE ROW LEVEL SECURITY;

-- Create policies for ibadah_records
CREATE POLICY "Users can manage own records" ON public.ibadah_records
    FOR ALL USING (auth.uid() = user_id);

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

-- Enable RLS on support_messages
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for support_messages
CREATE POLICY "Users can view own messages" ON public.support_messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create messages" ON public.support_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

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

-- Enable RLS on ramadhan_content
ALTER TABLE public.ramadhan_content ENABLE ROW LEVEL SECURITY;

-- Enable RLS on muhasabah_entries
ALTER TABLE public.muhasabah_entries ENABLE ROW LEVEL SECURITY;

-- Create policy for ramadhan_content (readable by all authenticated users)
CREATE POLICY "Authenticated users can view ramadhan content" ON public.ramadhan_content
    FOR SELECT USING (auth.role() = 'authenticated');

-- Create policies for muhasabah_entries
CREATE POLICY "Users can manage own muhasabah entries" ON public.muhasabah_entries
    FOR ALL USING (auth.uid() = user_id);

-- Insert default ibadah types
INSERT INTO public.ibadah_types (name, description, tracking_type, frequency, is_default, is_ramadhan_only) VALUES
('Salat Subuh', 'Salat wajib subuh', 'checklist', 'daily', true, false),
('Salat Dzuhur', 'Salat wajib dzuhur', 'checklist', 'daily', true, false),
('Salat Ashar', 'Salat wajib ashar', 'checklist', 'daily', true, false),
('Salat Maghrib', 'Salat wajib maghrib', 'checklist', 'daily', true, false),
('Salat Isya', 'Salat wajib isya', 'checklist', 'daily', true, false),
('Tilawah Al-Quran', 'Membaca Al-Quran', 'count', 'daily', true, false),
('Dzikir Pagi', 'Dzikir setelah salat subuh', 'checklist', 'daily', true, false),
('Dzikir Sore', 'Dzikir setelah salat ashar', 'checklist', 'daily', true, false),
('Istighfar', 'Membaca istighfar', 'count', 'daily', true, false),
('Sedekah', 'Memberikan sedekah', 'checklist', 'daily', true, false),
('Sahur', 'Makan sahur sebelum imsak', 'checklist', 'daily', true, true),
('Puasa', 'Menjalankan puasa Ramadhan', 'checklist', 'daily', true, true),
('Buka Puasa', 'Berbuka puasa tepat waktu', 'checklist', 'daily', true, true),
('Salat Tarawih', 'Salat tarawih di masjid atau rumah', 'checklist', 'daily', true, true),
('Tadarus Al-Quran', 'Membaca Al-Quran untuk khatam', 'count', 'daily', true, true),
('Sedekah Ramadhan', 'Sedekah khusus bulan Ramadhan', 'count', 'daily', true, true);

-- Create function to handle user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    );
    
    -- Add default ibadah for new user
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

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ibadah_types_updated_at BEFORE UPDATE ON public.ibadah_types
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_ibadah_updated_at BEFORE UPDATE ON public.user_ibadah
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ibadah_records_updated_at BEFORE UPDATE ON public.ibadah_records
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_messages_updated_at BEFORE UPDATE ON public.support_messages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ramadhan_content_updated_at BEFORE UPDATE ON public.ramadhan_content
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_muhasabah_entries_updated_at BEFORE UPDATE ON public.muhasabah_entries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
