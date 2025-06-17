-- ISTIQOMAH Database Setup - Step 4: Create Functions and Triggers
-- Run this after Step 3 is completed

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
    
    -- Add default ibadah for new user (non-Ramadhan only)
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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

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
