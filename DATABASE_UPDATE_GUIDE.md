# Database Update Guide - Muhasabah Feature

## 🚨 Important: Database Schema Update Required

The new features (Date Input, Enhanced Reports, and Muhasabah) require database schema updates. Please follow this guide to update your Supabase database.

## 📋 What's New

1. **Muhasabah Entries Table** - For daily self-reflection feature
2. **Enhanced Date Restrictions** - Users can only select today or past dates
3. **Improved Report Filtering** - Daily, monthly, yearly filters with real data

## 🔧 Database Setup Instructions

### Option 1: Run Updated Setup Scripts (Recommended)

If you're setting up a fresh database, simply run the updated setup scripts:

1. **Step 1**: Run `supabase-setup-step1.sql` (includes new muhasabah_entries table)
2. **Step 2**: Run `supabase-setup-step2.sql` (includes new RLS policies)
3. **Step 3**: Run `supabase-setup-step3.sql` (default data)
4. **Step 4**: Run `supabase-setup-step4.sql` (functions and triggers)

### Option 2: Update Existing Database

If you already have a working ISTIQOMAH database, run only the new additions:

#### 2.1 Create Muhasabah Table

```sql
-- Create muhasabah_entries table
CREATE TABLE IF NOT EXISTS public.muhasabah_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
```

#### 2.2 Enable RLS and Create Policies

```sql
-- Enable RLS on muhasabah_entries
ALTER TABLE public.muhasabah_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for muhasabah_entries
CREATE POLICY "Users can manage own muhasabah entries" ON public.muhasabah_entries
    FOR ALL USING (auth.uid() = user_id);
```

#### 2.3 Add Update Trigger

```sql
-- Create trigger for updated_at timestamp
CREATE TRIGGER update_muhasabah_entries_updated_at BEFORE UPDATE ON public.muhasabah_entries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

## 🧪 Testing the Setup

After running the database updates, test the new features:

### 1. Test Muhasabah Feature
1. Go to `/muhasabah` page
2. Fill in the reflection form
3. Try saving - should work without errors
4. Check `/muhasabah/jurnal` to see saved entries

### 2. Test Date Restrictions
1. Go to `/record-ibadah` or `/muhasabah`
2. Try selecting a future date - should be disabled
3. Only today and past dates should be selectable

### 3. Test Enhanced Reports
1. Go to `/laporan` page
2. Select filter type (Daily/Monthly/Yearly)
3. Choose date range
4. Click "Tampilkan Data" - should show real data
5. Download button should appear after data loads

## 🔍 Troubleshooting

### Error: "Save muhasabah error: {}"

**Cause**: Muhasabah table doesn't exist in database

**Solution**:
1. Run the database update scripts above
2. Refresh the page and try again

### Error: "null value in column 'id' violates not-null constraint"

**Cause**: UUID generation not working properly in muhasabah table

**Solution**:
1. Run `fix-muhasabah-uuid-issue.sql` in Supabase SQL Editor
2. This will recreate the table with proper UUID generation
3. Or use the "Auto Repair" button in `/database-check` page

### Error: "relation 'public.muhasabah_entries' does not exist"

**Cause**: Table creation script wasn't run

**Solution**:
1. Go to Supabase SQL Editor
2. Run the CREATE TABLE script from section 2.1 above

### Error: "permission denied for table muhasabah_entries"

**Cause**: RLS policies not set up correctly

**Solution**:
1. Run the RLS setup script from section 2.2 above
2. Make sure you're logged in as the correct user

## 📊 Database Schema Changes

### New Table: muhasabah_entries

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to auth.users |
| date | DATE | Date of the reflection |
| good_things | TEXT | What went well today |
| improvements | TEXT | What can be improved |
| prayers_hopes | TEXT | Prayers/hopes for tomorrow |
| mood | VARCHAR(20) | User's mood (optional) |
| created_at | TIMESTAMP | Record creation time |
| updated_at | TIMESTAMP | Last update time |

### Constraints
- **UNIQUE(user_id, date)**: One muhasabah entry per user per day
- **RLS Enabled**: Users can only access their own entries

## 🎯 New Features Overview

### 1. Date Input Restrictions
- All date inputs now have `max` attribute set to today
- Users cannot select future dates
- Applies to: Record Ibadah, Muhasabah, Reports

### 2. Enhanced Reports
- **Filter Types**: Daily, Monthly, Yearly
- **Two-step Process**: Filter first, then download
- **Real Data**: Shows actual database records
- **Summary Stats**: Completion rates, totals, etc.

### 3. Muhasabah (Self-Reflection)
- **Daily Form**: Three required fields + optional mood
- **Journal View**: Browse and search past entries
- **Date Selection**: Can write for any past date
- **Mood Tracking**: Visual emoji-based mood selection

## ✅ Verification Checklist

After setup, verify these work:

- [ ] Muhasabah form saves successfully
- [ ] Muhasabah journal shows saved entries
- [ ] Date inputs restrict future dates
- [ ] Reports show filtered data
- [ ] Download button appears after filtering
- [ ] Navigation includes new menu items
- [ ] No console errors in browser

## 🔍 Verification Commands

To verify the fix worked, run these in Supabase SQL Editor:

```sql
-- Check UUID extension
SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';

-- Test UUID generation
SELECT uuid_generate_v4() as test_uuid;

-- Check table structure
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'muhasabah_entries'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'muhasabah_entries'
    AND table_schema = 'public';

-- Test insert (replace with actual user ID from auth.users)
-- First get a user ID:
-- SELECT id FROM auth.users LIMIT 1;

-- Then test insert:
-- INSERT INTO public.muhasabah_entries (user_id, date, good_things, improvements, prayers_hopes)
-- VALUES ('your-user-id-here', CURRENT_DATE, 'Test', 'Test', 'Test');

-- Clean up test data:
-- DELETE FROM public.muhasabah_entries WHERE good_things = 'Test';
```

## 🆘 Need Help?

If you encounter issues:

1. Check browser console for detailed error messages
2. Verify all SQL scripts ran successfully
3. Check Supabase logs for database errors
4. Ensure you're using the latest code from the repository

## 🎉 Success!

Once everything is working, you'll have:
- ✅ Date-restricted input fields
- ✅ Enhanced report filtering with real data
- ✅ Complete muhasabah (self-reflection) system
- ✅ Improved user experience and data integrity

The ISTIQOMAH app now has powerful new features for better habit tracking and self-reflection! 🚀
