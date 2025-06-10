-- Fix Admin Support Messages and Settings Access
-- Run this SQL in Supabase SQL Editor to fix admin access issues

-- Ensure support_messages table exists
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

-- Ensure admin_settings table exists
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on both tables
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for support_messages
DROP POLICY IF EXISTS "Users can view own messages" ON public.support_messages;
CREATE POLICY "Users can view own messages" ON public.support_messages
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create messages" ON public.support_messages;
CREATE POLICY "Users can create messages" ON public.support_messages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all support messages" ON public.support_messages;
CREATE POLICY "Admins can view all support messages" ON public.support_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

DROP POLICY IF EXISTS "Admins can update support messages" ON public.support_messages;
CREATE POLICY "Admins can update support messages" ON public.support_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- Create policies for admin_settings
DROP POLICY IF EXISTS "Only admins can view settings" ON public.admin_settings;
CREATE POLICY "Only admins can view settings" ON public.admin_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

DROP POLICY IF EXISTS "Only admins can modify settings" ON public.admin_settings;
CREATE POLICY "Only admins can modify settings" ON public.admin_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- Insert default admin settings if they don't exist
INSERT INTO public.admin_settings (key, value, description) VALUES
('app_tagline', 'Muslim Habit Tracker', 'Tagline aplikasi yang ditampilkan di landing page'),
('welcome_message', 'Selamat datang di ISTIQOMAH! Mari tingkatkan kualitas ibadah kita bersama.', 'Pesan selamat datang untuk user baru'),
('maintenance_mode', 'false', 'Mode maintenance aplikasi (true/false)'),
('max_custom_ibadah', '10', 'Maksimal ibadah custom yang bisa dibuat user'),
('ramadhan_active', 'false', 'Status aktif fitur Ramadhan (true/false)'),
('support_email', 'support@istiqomah.app', 'Email support untuk kontak'),
('app_version', '1.0.0', 'Versi aplikasi saat ini'),
('backup_frequency', 'daily', 'Frekuensi backup data (daily/weekly/monthly)')
ON CONFLICT (key) DO NOTHING;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_support_messages_updated_at ON public.support_messages;
CREATE TRIGGER update_support_messages_updated_at
    BEFORE UPDATE ON public.support_messages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON public.admin_settings;
CREATE TRIGGER update_admin_settings_updated_at
    BEFORE UPDATE ON public.admin_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Verify tables and policies exist
SELECT 'Support messages table and policies created successfully!' as status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'support_messages');

SELECT 'Admin settings table and policies created successfully!' as status
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_settings');
