-- Enhancement: Add scheduling and unit features to ibadah system
-- Run this SQL in your Supabase SQL Editor

-- Add new columns to ibadah_types table
ALTER TABLE public.ibadah_types 
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS schedule_type TEXT CHECK (schedule_type IN ('always', 'date_range', 'specific_dates', 'ramadhan_auto')) DEFAULT 'always',
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS end_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS specific_dates DATE[] DEFAULT NULL;

-- Add new columns to user_ibadah table
ALTER TABLE public.user_ibadah 
ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT NULL;

-- Create index for better performance on date queries
CREATE INDEX IF NOT EXISTS idx_ibadah_types_schedule ON public.ibadah_types(schedule_type, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_ibadah_types_dates ON public.ibadah_types USING GIN(specific_dates);

-- Create function to check if ibadah should be active on a specific date
CREATE OR REPLACE FUNCTION public.is_ibadah_active_on_date(
    ibadah_type_row public.ibadah_types,
    target_date DATE DEFAULT CURRENT_DATE
) RETURNS BOOLEAN AS $$
BEGIN
    -- Always active
    IF ibadah_type_row.schedule_type = 'always' THEN
        RETURN TRUE;
    END IF;
    
    -- Date range
    IF ibadah_type_row.schedule_type = 'date_range' THEN
        RETURN target_date >= COALESCE(ibadah_type_row.start_date, target_date) 
           AND target_date <= COALESCE(ibadah_type_row.end_date, target_date);
    END IF;
    
    -- Specific dates
    IF ibadah_type_row.schedule_type = 'specific_dates' THEN
        RETURN target_date = ANY(ibadah_type_row.specific_dates);
    END IF;
    
    -- Ramadhan auto (controlled by admin)
    IF ibadah_type_row.schedule_type = 'ramadhan_auto' THEN
        -- This will be controlled by admin settings
        -- For now, return the is_ramadhan_only flag
        RETURN ibadah_type_row.is_ramadhan_only;
    END IF;
    
    -- Default to false for unknown schedule types
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Create function to get active ibadah types for a specific date
CREATE OR REPLACE FUNCTION public.get_active_ibadah_types_for_date(
    target_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    tracking_type TEXT,
    frequency TEXT,
    is_default BOOLEAN,
    is_ramadhan_only BOOLEAN,
    unit TEXT,
    schedule_type TEXT,
    start_date DATE,
    end_date DATE,
    specific_dates DATE[],
    created_by UUID,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        it.id,
        it.name,
        it.description,
        it.tracking_type,
        it.frequency,
        it.is_default,
        it.is_ramadhan_only,
        it.unit,
        it.schedule_type,
        it.start_date,
        it.end_date,
        it.specific_dates,
        it.created_by,
        it.created_at,
        it.updated_at
    FROM public.ibadah_types it
    WHERE public.is_ibadah_active_on_date(it, target_date);
END;
$$ LANGUAGE plpgsql;

-- Update existing default ibadah types with units where appropriate
UPDATE public.ibadah_types 
SET unit = 'ayat'
WHERE name = 'Tilawah Al-Quran' OR name = 'Tadarus Al-Quran';

UPDATE public.ibadah_types 
SET unit = 'kali'
WHERE name = 'Istighfar';

UPDATE public.ibadah_types 
SET unit = 'rupiah'
WHERE name LIKE '%Sedekah%';

-- Add comment for documentation
COMMENT ON COLUMN public.ibadah_types.unit IS 'Unit of measurement for count-based tracking (e.g., ayat, lembar, rupiah, kali)';
COMMENT ON COLUMN public.ibadah_types.schedule_type IS 'Type of scheduling: always, date_range, specific_dates, ramadhan_auto';
COMMENT ON COLUMN public.ibadah_types.start_date IS 'Start date for date_range schedule type';
COMMENT ON COLUMN public.ibadah_types.end_date IS 'End date for date_range schedule type';
COMMENT ON COLUMN public.ibadah_types.specific_dates IS 'Array of specific dates for specific_dates schedule type';
COMMENT ON FUNCTION public.is_ibadah_active_on_date IS 'Check if an ibadah type should be active on a specific date based on its schedule';
COMMENT ON FUNCTION public.get_active_ibadah_types_for_date IS 'Get all ibadah types that should be active on a specific date';
