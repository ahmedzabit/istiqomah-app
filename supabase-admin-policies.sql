-- ISTIQOMAH Admin Policies Setup
-- Run this after tables are created

-- Create policies for admin_settings (only admins can access)
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

-- Create policies for app_statistics (only admins can access)
DROP POLICY IF EXISTS "Only admins can view statistics" ON public.app_statistics;
CREATE POLICY "Only admins can view statistics" ON public.app_statistics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

DROP POLICY IF EXISTS "Only admins can modify statistics" ON public.app_statistics;
CREATE POLICY "Only admins can modify statistics" ON public.app_statistics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- Update support_messages policies to allow admin access
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

-- Update ramadhan_content policies to allow admin management
DROP POLICY IF EXISTS "Admins can manage ramadhan content" ON public.ramadhan_content;
CREATE POLICY "Admins can manage ramadhan content" ON public.ramadhan_content
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- Update ibadah_types policies to allow admin management
DROP POLICY IF EXISTS "Admins can manage all ibadah types" ON public.ibadah_types;
CREATE POLICY "Admins can manage all ibadah types" ON public.ibadah_types
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_admin_settings_updated_at ON public.admin_settings;
CREATE TRIGGER update_admin_settings_updated_at BEFORE UPDATE ON public.admin_settings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_statistics_updated_at ON public.app_statistics;
CREATE TRIGGER update_app_statistics_updated_at BEFORE UPDATE ON public.app_statistics
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
