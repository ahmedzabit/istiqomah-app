-- Fix: Create missing admin_settings table
-- This table is required for storing application settings like Ramadhan feature toggle

-- Create admin_settings table
CREATE TABLE IF NOT EXISTS public.admin_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON public.admin_settings(key);

-- Enable RLS
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for admin_settings
-- Only admins can read admin settings
DROP POLICY IF EXISTS "Admins can view admin settings" ON public.admin_settings;
CREATE POLICY "Admins can view admin settings" ON public.admin_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Only admins can update admin settings
DROP POLICY IF EXISTS "Admins can update admin settings" ON public.admin_settings;
CREATE POLICY "Admins can update admin settings" ON public.admin_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.is_admin = true
        )
    );

-- Insert default settings
INSERT INTO public.admin_settings (key, value, description) VALUES
    ('app_tagline', 'Aplikasi Tracking Ibadah Harian', 'Tagline aplikasi yang ditampilkan di halaman utama'),
    ('welcome_message', 'Selamat datang di ISTIQOMAH! Mari konsisten dalam beribadah.', 'Pesan selamat datang untuk pengguna baru'),
    ('maintenance_mode', 'false', 'Mode maintenance aplikasi (true/false)'),
    ('max_custom_ibadah', '10', 'Maksimal ibadah custom yang bisa dibuat user'),
    ('ramadhan_active', 'false', 'Status fitur Ramadhan (true/false)'),
    ('support_email', 'support@istiqomah.app', 'Email untuk kontak support'),
    ('app_version', '1.0.0', 'Versi aplikasi saat ini'),
    ('backup_frequency', 'daily', 'Frekuensi backup database (daily/weekly/monthly)')
ON CONFLICT (key) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON public.admin_settings;
CREATE TRIGGER update_admin_settings_updated_at
    BEFORE UPDATE ON public.admin_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_settings_updated_at();

-- Verify the table was created successfully
SELECT 'admin_settings table created successfully' as status;
SELECT key, value FROM public.admin_settings ORDER BY key;
