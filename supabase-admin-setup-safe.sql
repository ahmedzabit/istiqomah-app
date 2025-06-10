-- ISTIQOMAH Admin Setup - Safe Version
-- This version can be run multiple times without errors

-- Create admin_settings table for global app settings
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create app_statistics table for monitoring
CREATE TABLE IF NOT EXISTS public.app_statistics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    total_users INTEGER DEFAULT 0,
    active_users INTEGER DEFAULT 0,
    total_records INTEGER DEFAULT 0,
    total_support_messages INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables (safe to run multiple times)
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_statistics ENABLE ROW LEVEL SECURITY;

-- Insert default admin settings (safe with ON CONFLICT)
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

-- Create function to update daily statistics
CREATE OR REPLACE FUNCTION public.update_daily_statistics()
RETURNS void AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    user_count INTEGER;
    active_count INTEGER;
    record_count INTEGER;
    message_count INTEGER;
BEGIN
    -- Count total users
    SELECT COUNT(*) INTO user_count FROM public.profiles;
    
    -- Count active users (users with records in last 7 days)
    SELECT COUNT(DISTINCT user_id) INTO active_count 
    FROM public.ibadah_records 
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
    
    -- Count total records today
    SELECT COUNT(*) INTO record_count 
    FROM public.ibadah_records 
    WHERE date = today_date;
    
    -- Count support messages today
    SELECT COUNT(*) INTO message_count 
    FROM public.support_messages 
    WHERE DATE(created_at) = today_date;
    
    -- Insert or update statistics
    INSERT INTO public.app_statistics (date, total_users, active_users, total_records, total_support_messages)
    VALUES (today_date, user_count, active_count, record_count, message_count)
    ON CONFLICT (date) 
    DO UPDATE SET 
        total_users = EXCLUDED.total_users,
        active_users = EXCLUDED.active_users,
        total_records = EXCLUDED.total_records,
        total_support_messages = EXCLUDED.total_support_messages,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Run the policies separately if needed
-- See supabase-admin-setup.sql for complete setup with policies
