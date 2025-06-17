-- Create admin_settings table if it doesn't exist
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on key for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_settings_key ON admin_settings(key);

-- Insert default settings if they don't exist
INSERT INTO admin_settings (key, value, description) VALUES
  ('app_tagline', 'Muslim Habit Tracker', 'Tagline aplikasi')
ON CONFLICT (key) DO NOTHING;

INSERT INTO admin_settings (key, value, description) VALUES
  ('welcome_message', 'Selamat datang di ISTIQOMAH! Mari tingkatkan kualitas ibadah kita bersama.', 'Pesan selamat datang')
ON CONFLICT (key) DO NOTHING;

INSERT INTO admin_settings (key, value, description) VALUES
  ('maintenance_mode', 'false', 'Mode maintenance')
ON CONFLICT (key) DO NOTHING;

INSERT INTO admin_settings (key, value, description) VALUES
  ('max_custom_ibadah', '10', 'Maksimal ibadah custom per user')
ON CONFLICT (key) DO NOTHING;

INSERT INTO admin_settings (key, value, description) VALUES
  ('ramadhan_active', 'false', 'Fitur Ramadhan aktif')
ON CONFLICT (key) DO NOTHING;

INSERT INTO admin_settings (key, value, description) VALUES
  ('support_email', 'support@istiqomah.app', 'Email support')
ON CONFLICT (key) DO NOTHING;

INSERT INTO admin_settings (key, value, description) VALUES
  ('app_version', '1.0.0', 'Versi aplikasi')
ON CONFLICT (key) DO NOTHING;

INSERT INTO admin_settings (key, value, description) VALUES
  ('backup_frequency', 'daily', 'Frekuensi backup')
ON CONFLICT (key) DO NOTHING;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_settings_updated_at 
    BEFORE UPDATE ON admin_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
