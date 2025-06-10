import { createClient } from './client'
import type {
  IbadahType,
  UserIbadah,
  IbadahRecord,
  Profile,
  SupportMessage,
  Inserts,
  Updates
} from '@/types'

// Client-side database operations (use this for all operations)
export function getSupabase() {
  return createClient()
}

// Profile operations
export async function createProfile(profileData: Inserts<'profiles'>) {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('profiles')
    .insert(profileData)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateProfile(id: string, updates: Updates<'profiles'>) {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getProfile(id: string) {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// Ibadah Types operations
export async function getIbadahTypes(includeRamadhan?: boolean) {
  const supabase = getSupabase()

  // If includeRamadhan is not explicitly set, check admin setting
  let shouldIncludeRamadhan = includeRamadhan
  if (shouldIncludeRamadhan === undefined) {
    shouldIncludeRamadhan = await isRamadhanFeatureEnabled()
  }

  let query = supabase
    .from('ibadah_types')
    .select('*')
    .order('name')

  if (!shouldIncludeRamadhan) {
    query = query.eq('is_ramadhan_only', false)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function createIbadahType(ibadahData: Inserts<'ibadah_types'>) {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('ibadah_types')
    .insert(ibadahData)
    .select()
    .single()

  if (error) throw error
  return data
}

// User Ibadah operations
export async function getUserIbadah(userId: string) {
  const supabase = getSupabase()

  try {
    // Check if Ramadhan feature is enabled
    const ramadhanEnabled = await isRamadhanFeatureEnabled()

    const { data, error } = await supabase
      .from('user_ibadah')
      .select(`
        *,
        ibadah_types (*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching user ibadah:', error)
      throw error
    }

    // Filter out Ramadhan-only ibadah if feature is disabled
    if (!ramadhanEnabled && data) {
      return data.filter(item => !item.ibadah_types?.is_ramadhan_only)
    }

    return data || []
  } catch (error) {
    console.error('getUserIbadah error:', error)
    throw error
  }
}

export async function createUserIbadah(userIbadahData: Inserts<'user_ibadah'>) {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('user_ibadah')
    .insert(userIbadahData)
    .select()
    .single()

  if (error) throw error
  return data
}

// Ibadah Records operations
export async function getIbadahRecords(userId: string, date?: string) {
  const supabase = getSupabase()

  let query = supabase
    .from('ibadah_records')
    .select(`
      *,
      ibadah_types (*)
    `)
    .eq('user_id', userId)

  if (date) {
    query = query.eq('date', date)
  }

  query = query.order('date', { ascending: false })

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function upsertIbadahRecord(recordData: Inserts<'ibadah_records'>) {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('ibadah_records')
    .upsert(recordData, {
      onConflict: 'user_id,ibadah_type_id,date'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getWeeklyProgress(userId: string, startDate: string, endDate: string) {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('ibadah_records')
    .select('date, is_completed, ibadah_type_id')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) throw error
  return data
}

// Support Messages operations
export async function createSupportMessage(messageData: Inserts<'support_messages'>) {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('support_messages')
    .insert(messageData)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getSupportMessages(userId: string) {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('support_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// Dashboard data aggregation
export async function getDashboardData(userId: string) {
  const today = new Date().toISOString().split('T')[0]

  try {
    // Get user's active ibadah
    let userIbadah = await getUserIbadah(userId)

    // If user has no ibadah, initialize default ones
    if (!userIbadah || userIbadah.length === 0) {
      try {
        await initializeDefaultIbadahForUser(userId)
        userIbadah = await getUserIbadah(userId)
      } catch (initError) {
        console.error('Failed to initialize default ibadah:', initError)
        // Continue with empty array rather than failing completely
        userIbadah = []
      }
    }

    // Get today's records
    const todayRecords = await getIbadahRecords(userId, today)

    // Get weekly progress (last 7 days)
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 6)
    const weekStartStr = weekStart.toISOString().split('T')[0]

    const weeklyRecords = await getWeeklyProgress(userId, weekStartStr, today)

    return {
      userIbadah: userIbadah || [],
      todayRecords: todayRecords || [],
      weeklyRecords: weeklyRecords || []
    }
  } catch (error) {
    // Check if it's an RLS recursion error and provide specific guidance
    if (error?.message?.includes('infinite recursion') ||
        error?.message?.includes('recursion')) {
      console.error('RLS infinite recursion detected! This needs to be fixed in Supabase.')
      const recursionError = new Error(
        'Database configuration error: infinite recursion detected in policy for relation "profiles". ' +
        'Please run the SQL fix in fix-profiles-rls-recursion.sql to resolve this issue.'
      )
      recursionError.cause = error
      throw recursionError
    }

    console.error('Error fetching dashboard data:', {
      message: error?.message || 'Unknown error',
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
      name: error?.name,
      error: error
    })

    // Re-throw with more context
    const enhancedError = new Error(`Dashboard data fetch failed: ${error?.message || 'Unknown error'}`)
    enhancedError.cause = error
    throw enhancedError
  }
}

// Statistics calculations
export function calculateTodayProgress(userIbadah: any[], todayRecords: any[]) {
  if (userIbadah.length === 0) return 0
  
  const completedCount = todayRecords.filter(record => {
    const ibadah = userIbadah.find(ui => ui.ibadah_type_id === record.ibadah_type_id)
    if (!ibadah) return false
    
    if (ibadah.ibadah_types.tracking_type === 'checklist') {
      return record.is_completed
    } else {
      return record.count_value >= ibadah.target_count
    }
  }).length
  
  return Math.round((completedCount / userIbadah.length) * 100)
}

export function calculateWeeklyStats(weeklyRecords: any[]) {
  const dailyStats = new Map()

  // Group records by date
  weeklyRecords.forEach(record => {
    const date = record.date
    if (!dailyStats.has(date)) {
      dailyStats.set(date, { completed: 0, total: 0 })
    }

    const dayStats = dailyStats.get(date)
    dayStats.total++
    if (record.is_completed) {
      dayStats.completed++
    }
  })

  return Array.from(dailyStats.entries()).map(([date, stats]) => ({
    date,
    ...stats,
    percentage: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
  }))
}

// Database repair function
export async function repairMuhasabahTable() {
  const supabase = getSupabase()

  try {
    // First, try to enable UUID extension
    await supabase.rpc('exec_sql', {
      sql: 'CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'
    });

    // Drop and recreate the table with correct UUID generation
    const createTableSQL = `
      DROP TABLE IF EXISTS public.muhasabah_entries;

      CREATE TABLE public.muhasabah_entries (
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

      ALTER TABLE public.muhasabah_entries ENABLE ROW LEVEL SECURITY;

      CREATE POLICY "Users can manage own muhasabah entries" ON public.muhasabah_entries
          FOR ALL USING (auth.uid() = user_id);

      CREATE TRIGGER update_muhasabah_entries_updated_at
          BEFORE UPDATE ON public.muhasabah_entries
          FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    `;

    await supabase.rpc('exec_sql', { sql: createTableSQL });

    return { success: true, message: 'Muhasabah table repaired successfully' };
  } catch (err: any) {
    console.error('Error repairing muhasabah table:', err);
    return {
      success: false,
      message: err.message || 'Failed to repair muhasabah table'
    };
  }
}

// Database health check
export async function checkMuhasabahTableExists() {
  const supabase = getSupabase()

  try {
    const { data, error } = await supabase
      .from('muhasabah_entries')
      .select('id')
      .limit(1)

    if (error) {
      console.error('Muhasabah table check error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });

      // Check if it's a "relation does not exist" error
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return {
          exists: false,
          error: 'Table muhasabah_entries does not exist. Please run the database migration script.'
        }
      }

      return { exists: false, error: error.message || 'Unknown database error' }
    }

    return { exists: true, error: null }
  } catch (err: any) {
    console.error('Unexpected error in muhasabah table check:', err)
    return {
      exists: false,
      error: err.message || 'Unexpected error checking database table'
    }
  }
}

// Muhasabah operations
export async function getMuhasabahEntries(userId: string, dateFrom?: string, dateTo?: string) {
  const supabase = getSupabase()

  let query = supabase
    .from('muhasabah_entries')
    .select('*')
    .eq('user_id', userId)

  if (dateFrom) {
    query = query.gte('date', dateFrom)
  }
  if (dateTo) {
    query = query.lte('date', dateTo)
  }

  query = query.order('date', { ascending: false })

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getMuhasabahEntry(userId: string, date: string) {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('muhasabah_entries')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}



export async function upsertMuhasabahEntry(entryData: Inserts<'muhasabah_entries'>) {
  const supabase = getSupabase()

  try {
    // First check if table exists
    const tableCheck = await checkMuhasabahTableExists();
    if (!tableCheck.exists) {
      throw new Error(tableCheck.error || 'Tabel muhasabah belum dibuat. Silakan jalankan script database migration terlebih dahulu.');
    }

    const { data, error } = await supabase
      .from('muhasabah_entries')
      .upsert(entryData, {
        onConflict: 'user_id,date'
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });

      // Handle specific error cases
      if (error.code === '42P01') {
        throw new Error('Tabel muhasabah tidak ditemukan. Silakan jalankan script database migration.');
      }

      if (error.code === '23505') {
        // Duplicate key error - this is actually expected for upsert, try update instead
        const { data: updateData, error: updateError } = await supabase
          .from('muhasabah_entries')
          .update({
            good_things: entryData.good_things,
            improvements: entryData.improvements,
            prayers_hopes: entryData.prayers_hopes,
            mood: entryData.mood,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', entryData.user_id)
          .eq('date', entryData.date)
          .select()
          .single();

        if (updateError) {
          throw new Error(`Gagal memperbarui data: ${updateError.message}`);
        }
        return updateData;
      }

      throw new Error(error.message || 'Gagal menyimpan data muhasabah');
    }

    return data;
  } catch (err: any) {
    console.error('Error in upsertMuhasabahEntry:', err);
    throw err;
  }
}

// Enhanced report functions
export async function getIbadahRecordsForReport(
  userId: string,
  dateFrom: string,
  dateTo: string,
  ibadahTypeIds?: string[]
) {
  const supabase = getSupabase()

  let query = supabase
    .from('ibadah_records')
    .select(`
      *,
      ibadah_types (*)
    `)
    .eq('user_id', userId)
    .gte('date', dateFrom)
    .lte('date', dateTo)

  if (ibadahTypeIds && ibadahTypeIds.length > 0) {
    query = query.in('ibadah_type_id', ibadahTypeIds)
  }

  query = query.order('date', { ascending: false })

  const { data, error } = await query

  if (error) throw error
  return data
}

// Ramadhan-specific functions
export async function initializeRamadhanIbadah(userId: string) {
  const supabase = getSupabase()

  try {
    // Check if user already has Ramadhan ibadah
    const { data: existingRamadhanIbadah } = await supabase
      .from('user_ibadah')
      .select(`
        id,
        ibadah_type:ibadah_type_id (
          is_ramadhan_only
        )
      `)
      .eq('user_id', userId)

    // Filter for Ramadhan-only ibadah
    const ramadhanIbadah = existingRamadhanIbadah?.filter(item =>
      item.ibadah_type?.is_ramadhan_only
    ) || []

    if (ramadhanIbadah.length > 0) {
      return { message: 'Ramadhan ibadah already initialized', count: ramadhanIbadah.length }
    }

    // Get all Ramadhan ibadah types
    const { data: ramadhanTypes, error: typesError } = await supabase
      .from('ibadah_types')
      .select('*')
      .eq('is_ramadhan_only', true)
      .eq('is_default', true)

    if (typesError) throw typesError

    if (!ramadhanTypes || ramadhanTypes.length === 0) {
      throw new Error('No default Ramadhan ibadah types found')
    }

    // Create user ibadah for each Ramadhan type
    const userIbadahData = ramadhanTypes.map(type => ({
      user_id: userId,
      ibadah_type_id: type.id,
      target_count: type.tracking_type === 'count' ? 5 : 1, // Default targets
      is_active: true
    }))

    const { data: createdUserIbadah, error: createError } = await supabase
      .from('user_ibadah')
      .insert(userIbadahData)
      .select()

    if (createError) throw createError

    return {
      message: 'Ramadhan ibadah initialized successfully',
      count: createdUserIbadah.length
    }
  } catch (error) {
    console.error('Error initializing Ramadhan ibadah:', {
      message: error?.message || 'Unknown error',
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      error: error
    })
    throw new Error('Gagal menginisialisasi ibadah Ramadhan')
  }
}

export async function getRamadhanIbadahForUser(userId: string, date?: string) {
  const supabase = getSupabase()
  const targetDate = date || new Date().toISOString().split('T')[0]

  try {
    // Get user's Ramadhan ibadah
    const { data: userIbadah, error: userError } = await supabase
      .from('user_ibadah')
      .select(`
        id,
        target_count,
        ibadah_type:ibadah_type_id (
          id,
          name,
          description,
          tracking_type,
          is_ramadhan_only
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true)

    if (userError) throw userError

    // Filter for Ramadhan-only ibadah
    const ramadhanIbadah = userIbadah?.filter(item =>
      item.ibadah_type?.is_ramadhan_only
    ) || []

    // Get records for the target date
    const { data: records, error: recordsError } = await supabase
      .from('ibadah_records')
      .select('*')
      .eq('user_id', userId)
      .eq('date', targetDate)

    if (recordsError) throw recordsError

    // Combine ibadah with records
    const result = ramadhanIbadah.map(ibadah => {
      const record = records?.find(r => r.ibadah_type_id === ibadah.ibadah_type?.id)
      return {
        ...ibadah,
        record: record || null,
        is_completed: record ?
          (ibadah.ibadah_type?.tracking_type === 'checklist'
            ? record.is_completed
            : record.count_value >= ibadah.target_count
          ) : false,
        count_value: record?.count_value || 0
      }
    })

    return result
  } catch (error) {
    console.error('Error fetching Ramadhan ibadah:', {
      message: error?.message || 'Unknown error',
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      error: error
    })
    throw new Error('Gagal memuat ibadah Ramadhan')
  }
}

// Admin settings functions
export async function getAdminSetting(key: string) {
  const supabase = getSupabase()

  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', key)
      .single()

    if (error) {
      // Handle specific error codes
      if (error.code === 'PGRST116') {
        // No rows returned
        return null
      }
      if (error.code === '42P01') {
        // Table doesn't exist
        console.warn('Admin settings table does not exist')
        return null
      }
      if (error.code === '406' || error.message.includes('406')) {
        // Not acceptable - likely RLS issue
        console.warn('Admin settings access denied - RLS policy issue')
        return null
      }
      if (error.code === '500' || error.message.includes('500')) {
        // Server error - likely table doesn't exist
        console.warn('Admin settings server error - table may not exist')
        return null
      }
      // For any other error, log it but don't throw to prevent dashboard crash
      console.warn('Admin settings error:', error.message)
      return null
    }

    return data?.value || null
  } catch (error) {
    console.error('Error fetching admin setting:', {
      message: error?.message || 'Unknown error',
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      error: error
    })
    return null
  }
}

export async function isRamadhanFeatureEnabled() {
  try {
    const ramadhanActive = await getAdminSetting('ramadhan_active')

    // If setting doesn't exist, return default value
    if (ramadhanActive === null) {
      return false // Default to false
    }

    return ramadhanActive === 'true'
  } catch (error) {
    // Check if it's an RLS recursion error
    if (error?.message?.includes('infinite recursion') ||
        error?.message?.includes('recursion')) {
      console.warn('RLS recursion detected in Ramadhan feature check, returning default value')
      return false // Safe default
    }

    console.error('Error checking Ramadhan feature:', {
      message: error?.message || 'Unknown error',
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      error: error
    })

    // Always return false if there's any error
    // This prevents the dashboard from breaking
    return false
  }
}

export async function toggleRamadhanIbadahStatus(isEnabled: boolean) {
  const supabase = getSupabase()

  try {
    // Update all user_ibadah entries for Ramadhan-only ibadah types
    const { error } = await supabase
      .from('user_ibadah')
      .update({ is_active: isEnabled })
      .in('ibadah_type_id',
        supabase
          .from('ibadah_types')
          .select('id')
          .eq('is_ramadhan_only', true)
      )

    if (error) throw error

    return { message: `Ramadhan ibadah ${isEnabled ? 'activated' : 'deactivated'} for all users` }
  } catch (error) {
    console.error('Error toggling Ramadhan ibadah status:', {
      message: error?.message || 'Unknown error',
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      error: error
    })
    throw new Error('Gagal mengubah status ibadah Ramadhan')
  }
}



export async function initializeDefaultIbadahForUser(userId: string) {
  const supabase = getSupabase()

  try {
    // Check if user already has any ibadah
    const { data: existingIbadah, error: checkError } = await supabase
      .from('user_ibadah')
      .select('id')
      .eq('user_id', userId)
      .limit(1)

    if (checkError) {
      console.error('Error checking existing ibadah:', checkError)
      // Continue anyway, might be RLS issue
    }

    if (existingIbadah && existingIbadah.length > 0) {
      return { message: 'User already has ibadah initialized' }
    }

    // Get default ibadah types (excluding Ramadhan for default setup)
    const { data: defaultTypes, error: typesError } = await supabase
      .from('ibadah_types')
      .select('*')
      .eq('is_default', true)
      .eq('is_ramadhan_only', false)

    if (typesError) {
      console.error('Error fetching default types:', typesError)
      throw typesError
    }

    if (!defaultTypes || defaultTypes.length === 0) {
      console.warn('No default ibadah types found')
      return { message: 'No default ibadah types found' }
    }

    // Create user ibadah for each default type
    const userIbadahData = defaultTypes.map(type => ({
      user_id: userId,
      ibadah_type_id: type.id,
      target_count: type.tracking_type === 'count' ?
        (type.name === 'Tilawah Al-Quran' ? 5 :
         type.name === 'Istighfar' ? 100 : 1) : 1,
      is_active: true
    }))

    const { data: createdUserIbadah, error: createError } = await supabase
      .from('user_ibadah')
      .insert(userIbadahData)
      .select()

    if (createError) {
      console.error('Error creating user ibadah:', createError)
      throw createError
    }

    return {
      message: 'Default ibadah initialized successfully',
      count: createdUserIbadah?.length || 0
    }
  } catch (error) {
    console.error('Error initializing default ibadah:', {
      message: error?.message || 'Unknown error',
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      error: error
    })
    throw new Error(`Gagal menginisialisasi ibadah default: ${error?.message || 'Unknown error'}`)
  }
}
