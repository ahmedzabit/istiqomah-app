-- ISTIQOMAH Database Setup - Step 3: Insert Default Data (Simple Version)
-- Run this after Step 2 is completed

-- Clear existing default data (if any)
DELETE FROM public.ibadah_types WHERE is_default = true;

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
