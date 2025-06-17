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

// Get active ibadah types for a specific date
export async function getActiveIbadahTypesForDate(targetDate?: string) {
  const supabase = getSupabase()
  const date = targetDate || new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .rpc('get_active_ibadah_types_for_date', { target_date: date })

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

// Get all user ibadah (including inactive) for management
export async function getAllUserIbadah(userId: string) {
  const supabase = getSupabase()

  try {
    const { data, error } = await supabase
      .from('user_ibadah')
      .select(`
        *,
        ibadah_types (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching all user ibadah:', error)
      throw error
    }

    return data || []
  } catch (error) {
    console.error('getAllUserIbadah error:', error)
    throw error
  }
}

// Update user ibadah
export async function updateUserIbadah(id: string, updates: Updates<'user_ibadah'>) {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('user_ibadah')
    .update(updates)
    .eq('id', id)
    .select(`
      *,
      ibadah_types (*)
    `)
    .single()

  if (error) throw error
  return data
}

// Update ibadah type
export async function updateIbadahType(id: string, updates: Updates<'ibadah_types'>) {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('ibadah_types')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Delete user ibadah (soft delete by setting inactive)
export async function deleteUserIbadah(id: string) {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('user_ibadah')
    .update({ is_active: false })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Hard delete user ibadah (for custom ibadah types)
export async function hardDeleteUserIbadah(userIbadahId: string, ibadahTypeId: string, userId: string) {
  const supabase = getSupabase()

  try {
    // First check if this is a custom ibadah type (created by user)
    const { data: ibadahType, error: typeError } = await supabase
      .from('ibadah_types')
      .select('created_by, is_default')
      .eq('id', ibadahTypeId)
      .single()

    if (typeError) throw typeError

    // Delete user_ibadah record
    const { error: userIbadahError } = await supabase
      .from('user_ibadah')
      .delete()
      .eq('id', userIbadahId)

    if (userIbadahError) throw userIbadahError

    // If it's a custom ibadah type (not default), delete the type as well
    if (ibadahType && !ibadahType.is_default && ibadahType.created_by === userId) {
      // Delete related records first
      await supabase
        .from('ibadah_records')
        .delete()
        .eq('ibadah_type_id', ibadahTypeId)
        .eq('user_id', userId)

      // Delete the ibadah type
      await supabase
        .from('ibadah_types')
        .delete()
        .eq('id', ibadahTypeId)
    }

    return { success: true }
  } catch (error) {
    console.error('Error in hardDeleteUserIbadah:', error)
    throw error
  }
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

// Filter user ibadah based on scheduling
async function filterIbadahBySchedule(userIbadah: any[], targetDate: string) {
  if (!userIbadah || userIbadah.length === 0) return []

  const filteredIbadah = []

  for (const ibadah of userIbadah) {
    const ibadahType = ibadah.ibadah_types
    if (!ibadahType) continue

    // Check if this ibadah should be active on the target date
    const isActive = isIbadahActiveOnDate(ibadahType, targetDate)
    if (isActive) {
      filteredIbadah.push(ibadah)
    }
  }

  return filteredIbadah
}

// Check if an ibadah type should be active on a specific date
function isIbadahActiveOnDate(ibadahType: any, targetDate: string): boolean {
  const scheduleType = ibadahType.schedule_type || 'always'
  const target = new Date(targetDate)

  switch (scheduleType) {
    case 'always':
      return true

    case 'date_range':
      if (!ibadahType.start_date || !ibadahType.end_date) return true
      const startDate = new Date(ibadahType.start_date)
      const endDate = new Date(ibadahType.end_date)
      return target >= startDate && target <= endDate

    case 'specific_dates':
      if (!ibadahType.specific_dates || !Array.isArray(ibadahType.specific_dates)) return false
      return ibadahType.specific_dates.some((date: string) => {
        const specificDate = new Date(date)
        return specificDate.toDateString() === target.toDateString()
      })

    case 'ramadhan_auto':
      // This should be controlled by admin settings
      // For now, return the is_ramadhan_only flag
      return ibadahType.is_ramadhan_only || false

    default:
      return true
  }
}

// Dashboard data aggregation with scheduling support
export async function getDashboardData(userId: string, targetDate?: string) {
  const today = targetDate || new Date().toISOString().split('T')[0]

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

    // Filter ibadah based on scheduling for the target date
    const filteredUserIbadah = await filterIbadahBySchedule(userIbadah, today)

    // Get today's records
    const todayRecords = await getIbadahRecords(userId, today)

    // Get weekly progress (last 7 days)
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 6)
    const weekStartStr = weekStart.toISOString().split('T')[0]

    const weeklyRecords = await getWeeklyProgress(userId, weekStartStr, today)

    return {
      userIbadah: filteredUserIbadah || [],
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

// Admin ibadah management functions
export async function getAllIbadahTypes() {
  const supabase = getSupabase()

  try {
    const { data, error } = await supabase
      .from('ibadah_types')
      .select('*')
      .order('is_default', { ascending: false })
      .order('is_ramadhan_only', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching all ibadah types:', error)
    throw error
  }
}

export async function createDefaultIbadahType(ibadahTypeData: Inserts<'ibadah_types'>) {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('ibadah_types')
    .insert({
      ...ibadahTypeData,
      is_default: true,
      created_by: null // Admin created
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateDefaultIbadahType(id: string, updates: Updates<'ibadah_types'>) {
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from('ibadah_types')
    .update(updates)
    .eq('id', id)
    .eq('is_default', true) // Only allow updating default types
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteDefaultIbadahType(id: string) {
  const supabase = getSupabase()

  try {
    // First, delete all user_ibadah records that reference this type
    await supabase
      .from('user_ibadah')
      .delete()
      .eq('ibadah_type_id', id)

    // Then delete all ibadah_records that reference this type
    await supabase
      .from('ibadah_records')
      .delete()
      .eq('ibadah_type_id', id)

    // Finally, delete the ibadah type itself
    const { data, error } = await supabase
      .from('ibadah_types')
      .delete()
      .eq('id', id)
      .eq('is_default', true) // Only allow deleting default types
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error deleting default ibadah type:', error)
    throw error
  }
}

export async function getIbadahTypeUsageStats(id: string) {
  const supabase = getSupabase()

  try {
    // Get count of users using this ibadah type
    const { count: userCount, error: userError } = await supabase
      .from('user_ibadah')
      .select('*', { count: 'exact', head: true })
      .eq('ibadah_type_id', id)

    if (userError) throw userError

    // Get count of records for this ibadah type
    const { count: recordCount, error: recordError } = await supabase
      .from('ibadah_records')
      .select('*', { count: 'exact', head: true })
      .eq('ibadah_type_id', id)

    if (recordError) throw recordError

    return {
      userCount: userCount || 0,
      recordCount: recordCount || 0
    }
  } catch (error) {
    console.error('Error fetching ibadah type usage stats:', error)
    throw error
  }
}

// Bulk operations for admin
export async function bulkCreateDefaultIbadah(ibadahTypes: Inserts<'ibadah_types'>[]) {
  const supabase = getSupabase()

  const dataWithDefaults = ibadahTypes.map(type => ({
    ...type,
    is_default: true,
    created_by: null
  }))

  const { data, error } = await supabase
    .from('ibadah_types')
    .insert(dataWithDefaults)
    .select()

  if (error) throw error
  return data
}

export async function toggleIbadahTypeStatus(id: string, isActive: boolean) {
  const supabase = getSupabase()

  // For now, we'll use a custom field or handle this in the UI
  // Since there's no is_active field in ibadah_types, we might need to add it
  // or handle this differently

  const { data, error } = await supabase
    .from('ibadah_types')
    .update({
      updated_at: new Date().toISOString(),
      // Add any status field if needed
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// Admin user management functions
export async function getUserDetailForAdmin(userId: string) {
  const supabase = getSupabase()

  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) throw profileError

    // Get user's ibadah
    const { data: userIbadah, error: ibadahError } = await supabase
      .from('user_ibadah')
      .select(`
        *,
        ibadah_types (*)
      `)
      .eq('user_id', userId)

    if (ibadahError) throw ibadahError

    // Get user's records count
    const { count: totalRecords, error: recordsError } = await supabase
      .from('ibadah_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (recordsError) throw recordsError

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentRecords, error: recentError } = await supabase
      .from('ibadah_records')
      .select(`
        *,
        ibadah_types (name)
      `)
      .eq('user_id', userId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false })
      .limit(50)

    if (recentError) throw recentError

    // Calculate statistics
    const activeIbadahCount = userIbadah?.filter(ui => ui.is_active).length || 0
    const completedToday = recentRecords?.filter(r => {
      const today = new Date().toISOString().split('T')[0]
      return r.date === today && (r.is_completed || r.count_value > 0)
    }).length || 0

    // Calculate streak (consecutive days with at least one completed ibadah)
    let currentStreak = 0
    const today = new Date()
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(today.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]

      const hasActivity = recentRecords?.some(r =>
        r.date === dateStr && (r.is_completed || r.count_value > 0)
      )

      if (hasActivity) {
        currentStreak++
      } else if (i > 0) { // Don't break on first day (today) if no activity yet
        break
      }
    }

    // Get weekly activity for chart
    const weeklyActivity = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dayRecords = recentRecords?.filter(r => r.date === dateStr) || []
      const completedCount = dayRecords.filter(r => r.is_completed || r.count_value > 0).length

      weeklyActivity.push({
        date: dateStr,
        day: date.toLocaleDateString('id-ID', { weekday: 'short' }),
        completed: completedCount,
        total: dayRecords.length
      })
    }

    return {
      profile,
      userIbadah: userIbadah || [],
      totalRecords: totalRecords || 0,
      recentRecords: recentRecords || [],
      statistics: {
        activeIbadahCount,
        completedToday,
        currentStreak,
        weeklyActivity
      }
    }
  } catch (error) {
    console.error('Error fetching user detail:', error)
    throw error
  }
}

export async function getUserIbadahHistory(userId: string, limit = 100) {
  const supabase = getSupabase()

  try {
    const { data, error } = await supabase
      .from('ibadah_records')
      .select(`
        *,
        ibadah_types (name, tracking_type, unit)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching user ibadah history:', error)
    throw error
  }
}

export async function getUserMonthlyStats(userId: string, year: number, month: number) {
  const supabase = getSupabase()

  try {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('ibadah_records')
      .select(`
        *,
        ibadah_types (name, tracking_type)
      `)
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (error) throw error

    // Group by date and calculate daily completion rate
    const dailyStats = {}
    data?.forEach(record => {
      if (!dailyStats[record.date]) {
        dailyStats[record.date] = { total: 0, completed: 0 }
      }
      dailyStats[record.date].total++
      if (record.is_completed || record.count_value > 0) {
        dailyStats[record.date].completed++
      }
    })

    return {
      records: data || [],
      dailyStats,
      totalDays: Object.keys(dailyStats).length,
      averageCompletion: Object.values(dailyStats).reduce((acc: number, day: any) =>
        acc + (day.completed / day.total), 0) / Object.keys(dailyStats).length || 0
    }
  } catch (error) {
    console.error('Error fetching user monthly stats:', error)
    throw error
  }
}

export async function deleteUserAccount(userId: string) {
  const supabase = getSupabase()

  try {
    // First, get user info for logging
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    if (profileError) throw profileError

    // Delete all user's ibadah records
    const { error: recordsError } = await supabase
      .from('ibadah_records')
      .delete()
      .eq('user_id', userId)

    if (recordsError) throw recordsError

    // Delete all user's ibadah settings
    const { error: ibadahError } = await supabase
      .from('user_ibadah')
      .delete()
      .eq('user_id', userId)

    if (ibadahError) throw ibadahError

    // Delete custom ibadah types created by user
    const { error: customIbadahError } = await supabase
      .from('ibadah_types')
      .delete()
      .eq('created_by', userId)

    if (customIbadahError) throw customIbadahError

    // Delete user profile
    const { error: deleteProfileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (deleteProfileError) throw deleteProfileError

    // Delete from auth (this requires admin privileges)
    // Note: This might need to be done via Supabase Admin API or RPC function
    try {
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      if (authError) {
        console.warn('Could not delete from auth:', authError)
        // Continue anyway as profile is already deleted
      }
    } catch (authError) {
      console.warn('Auth deletion not available:', authError)
      // This is expected if not using admin client
    }

    return {
      success: true,
      deletedUser: userProfile,
      message: `User ${userProfile.email} has been completely deleted`
    }
  } catch (error) {
    console.error('Error deleting user account:', error)
    throw error
  }
}

export async function getUserDeletionImpact(userId: string) {
  const supabase = getSupabase()

  try {
    // Get counts of data that will be deleted
    const [
      { count: recordsCount },
      { count: ibadahCount },
      { count: customIbadahCount }
    ] = await Promise.all([
      supabase
        .from('ibadah_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('user_ibadah')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('ibadah_types')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', userId)
    ])

    return {
      recordsCount: recordsCount || 0,
      ibadahCount: ibadahCount || 0,
      customIbadahCount: customIbadahCount || 0
    }
  } catch (error) {
    console.error('Error getting user deletion impact:', error)
    throw error
  }
}

// Report analytics functions
export async function getIbadahAnalytics(userId: string, dateFrom: string, dateTo: string) {
  const supabase = getSupabase()

  try {
    // Get all user's ibadah with records in the period
    const { data: userIbadah, error: ibadahError } = await supabase
      .from('user_ibadah')
      .select(`
        *,
        ibadah_types (*)
      `)
      .eq('user_id', userId)
      .eq('is_active', true)

    if (ibadahError) throw ibadahError

    // Get all records for the period
    const { data: records, error: recordsError } = await supabase
      .from('ibadah_records')
      .select('*')
      .eq('user_id', userId)
      .gte('date', dateFrom)
      .lte('date', dateTo)

    if (recordsError) throw recordsError

    // Calculate analytics for each ibadah
    const analytics = userIbadah?.map(ui => {
      const ibadahRecords = records?.filter(r => r.ibadah_type_id === ui.ibadah_type_id) || []

      // Calculate total possible days
      const startDate = new Date(dateFrom)
      const endDate = new Date(dateTo)
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1

      // Calculate completion rate
      const completedRecords = ibadahRecords.filter(r => {
        if (ui.ibadah_types.tracking_type === 'checklist') {
          return r.is_completed
        } else {
          return r.count_value >= ui.target_count
        }
      })

      const completionRate = totalDays > 0 ? (completedRecords.length / totalDays) * 100 : 0

      // Calculate average count for count-based ibadah
      const averageCount = ibadahRecords.length > 0
        ? ibadahRecords.reduce((sum, r) => sum + (r.count_value || 0), 0) / ibadahRecords.length
        : 0

      // Calculate streak
      let currentStreak = 0
      let maxStreak = 0
      let tempStreak = 0

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0]
        const dayRecord = ibadahRecords.find(r => r.date === dateStr)

        const isCompleted = dayRecord ? (
          ui.ibadah_types.tracking_type === 'checklist'
            ? dayRecord.is_completed
            : dayRecord.count_value >= ui.target_count
        ) : false

        if (isCompleted) {
          tempStreak++
          maxStreak = Math.max(maxStreak, tempStreak)
          if (d.toDateString() === new Date().toDateString() || d < new Date()) {
            currentStreak = tempStreak
          }
        } else {
          tempStreak = 0
          if (d.toDateString() === new Date().toDateString()) {
            currentStreak = 0
          }
        }
      }

      return {
        ibadah_type_id: ui.ibadah_type_id,
        name: ui.ibadah_types.name,
        description: ui.ibadah_types.description,
        tracking_type: ui.ibadah_types.tracking_type,
        target_count: ui.target_count,
        unit: ui.unit || ui.ibadah_types.unit,
        totalDays,
        recordedDays: ibadahRecords.length,
        completedDays: completedRecords.length,
        completionRate: Math.round(completionRate * 100) / 100,
        averageCount: Math.round(averageCount * 100) / 100,
        currentStreak,
        maxStreak,
        totalCount: ibadahRecords.reduce((sum, r) => sum + (r.count_value || 0), 0)
      }
    }) || []

    // Sort by completion rate for ranking
    const sortedByCompletion = [...analytics].sort((a, b) => b.completionRate - a.completionRate)

    return {
      analytics,
      topPerforming: sortedByCompletion.slice(0, 5),
      needsImprovement: sortedByCompletion.slice(-5).reverse()
    }
  } catch (error) {
    console.error('Error getting ibadah analytics:', error)
    throw error
  }
}

export async function getMonthlyConsistencyData(userId: string, year: number) {
  const supabase = getSupabase()

  try {
    const monthlyData = []

    for (let month = 0; month < 12; month++) {
      const startDate = new Date(year, month, 1).toISOString().split('T')[0]
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]

      // Get records for this month
      const { data: records, error } = await supabase
        .from('ibadah_records')
        .select(`
          *,
          ibadah_types (tracking_type)
        `)
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)

      if (error) throw error

      // Get user ibadah settings for this period
      const { data: userIbadah, error: ibadahError } = await supabase
        .from('user_ibadah')
        .select('*')
        .eq('user_id', userId)

      if (ibadahError) throw ibadahError

      // Calculate completion rate for the month
      const totalRecords = records?.length || 0
      const completedRecords = records?.filter(r => {
        const userIbadahItem = userIbadah?.find(ui => ui.ibadah_type_id === r.ibadah_type_id)
        if (!userIbadahItem) return false

        return r.ibadah_types.tracking_type === 'checklist'
          ? r.is_completed
          : r.count_value >= userIbadahItem.target_count
      }).length || 0

      const completionRate = totalRecords > 0 ? (completedRecords / totalRecords) * 100 : 0

      monthlyData.push({
        month: month + 1,
        monthName: new Date(year, month).toLocaleDateString('id-ID', { month: 'long' }),
        totalRecords,
        completedRecords,
        completionRate: Math.round(completionRate * 100) / 100
      })
    }

    return monthlyData
  } catch (error) {
    console.error('Error getting monthly consistency data:', error)
    throw error
  }
}

export async function getIbadahTrends(userId: string, dateFrom: string, dateTo: string) {
  const supabase = getSupabase()

  try {
    // Get daily aggregated data
    const { data: records, error } = await supabase
      .from('ibadah_records')
      .select(`
        date,
        is_completed,
        count_value,
        ibadah_type_id,
        ibadah_types (tracking_type)
      `)
      .eq('user_id', userId)
      .gte('date', dateFrom)
      .lte('date', dateTo)
      .order('date', { ascending: true })

    if (error) throw error

    // Get user ibadah settings
    const { data: userIbadah, error: ibadahError } = await supabase
      .from('user_ibadah')
      .select('*')
      .eq('user_id', userId)

    if (ibadahError) throw ibadahError

    // Group by date and calculate daily completion rates
    const dailyData = new Map()

    records?.forEach(record => {
      if (!dailyData.has(record.date)) {
        dailyData.set(record.date, { total: 0, completed: 0 })
      }

      const dayData = dailyData.get(record.date)
      dayData.total++

      const userIbadahItem = userIbadah?.find(ui => ui.ibadah_type_id === record.ibadah_type_id)
      if (userIbadahItem) {
        const isCompleted = record.ibadah_types.tracking_type === 'checklist'
          ? record.is_completed
          : record.count_value >= userIbadahItem.target_count

        if (isCompleted) {
          dayData.completed++
        }
      }
    })

    // Convert to array and calculate completion rates
    const trendData = Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      total: data.total,
      completed: data.completed,
      completionRate: data.total > 0 ? (data.completed / data.total) * 100 : 0
    }))

    return trendData
  } catch (error) {
    console.error('Error getting ibadah trends:', error)
    throw error
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
