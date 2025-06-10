import { createClient } from './client'

// Admin-specific database operations
export function getAdminSupabase() {
  return createClient()
}

// User Management
export async function getAllUsers(page: number = 1, limit: number = 50) {
  const supabase = getAdminSupabase()
  const offset = (page - 1) * limit
  
  const { data, error, count } = await supabase
    .from('profiles')
    .select(`
      *,
      user_ibadah(count),
      ibadah_records(count)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  
  if (error) throw error
  return { users: data, total: count }
}

export async function getUserProgress(userId: string, days: number = 30) {
  const supabase = getAdminSupabase()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const { data, error } = await supabase
    .from('ibadah_records')
    .select(`
      *,
      ibadah_types(name, tracking_type)
    `)
    .eq('user_id', userId)
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: false })
  
  if (error) throw error
  return data
}

export async function updateUserStatus(userId: string, isAdmin: boolean) {
  const supabase = getAdminSupabase()
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ is_admin: isAdmin })
    .eq('id', userId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Support Management
export async function getAllSupportMessages(status?: string) {
  const supabase = getAdminSupabase()
  
  let query = supabase
    .from('support_messages')
    .select(`
      *,
      profiles(full_name, email)
    `)
    .order('created_at', { ascending: false })
  
  if (status) {
    query = query.eq('status', status)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data
}

export async function updateSupportMessage(id: string, updates: {
  status?: string
  admin_reply?: string
}) {
  const supabase = getAdminSupabase()
  
  const { data, error } = await supabase
    .from('support_messages')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Ramadhan Content Management
export async function getRamadhanContent() {
  const supabase = getAdminSupabase()
  
  const { data, error } = await supabase
    .from('ramadhan_content')
    .select('*')
    .order('date', { ascending: true })
  
  if (error) throw error
  return data
}

export async function upsertRamadhanContent(content: {
  date: string
  ayat?: string
  hadis?: string
  tips?: string
  doa?: string
}) {
  const supabase = getAdminSupabase()
  
  const { data, error } = await supabase
    .from('ramadhan_content')
    .upsert(content, { onConflict: 'date' })
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Ibadah Types Management
export async function getAllIbadahTypes() {
  const supabase = getAdminSupabase()
  
  const { data, error } = await supabase
    .from('ibadah_types')
    .select(`
      *,
      user_ibadah(count),
      ibadah_records(count)
    `)
    .order('name')
  
  if (error) throw error
  return data
}

export async function updateIbadahType(id: string, updates: {
  name?: string
  description?: string
  is_default?: boolean
  is_ramadhan_only?: boolean
}) {
  const supabase = getAdminSupabase()
  
  const { data, error } = await supabase
    .from('ibadah_types')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deleteIbadahType(id: string) {
  const supabase = getAdminSupabase()
  
  const { error } = await supabase
    .from('ibadah_types')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Admin Settings Management
export async function getAdminSettings() {
  const supabase = getAdminSupabase()
  
  const { data, error } = await supabase
    .from('admin_settings')
    .select('*')
    .order('key')
  
  if (error) throw error
  return data
}

export async function updateAdminSetting(key: string, value: string) {
  const supabase = getAdminSupabase()
  
  const { data, error } = await supabase
    .from('admin_settings')
    .upsert({ key, value }, { onConflict: 'key' })
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Statistics
export async function getAppStatistics(days: number = 30) {
  const supabase = getAdminSupabase()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  
  const { data, error } = await supabase
    .from('app_statistics')
    .select('*')
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: true })
  
  if (error) throw error
  return data
}

export async function updateDailyStatistics() {
  const supabase = getAdminSupabase()
  
  const { data, error } = await supabase
    .rpc('update_daily_statistics')
  
  if (error) throw error
  return data
}

// Dashboard Analytics
export async function getDashboardAnalytics() {
  const supabase = getAdminSupabase()
  
  try {
    // Get total users
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    // Get active users (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { data: activeUsersData } = await supabase
      .from('ibadah_records')
      .select('user_id')
      .gte('created_at', sevenDaysAgo.toISOString())
    
    const activeUsers = new Set(activeUsersData?.map(r => r.user_id)).size

    // Get today's records
    const today = new Date().toISOString().split('T')[0]
    const { count: todayRecords } = await supabase
      .from('ibadah_records')
      .select('*', { count: 'exact', head: true })
      .eq('date', today)

    // Get pending support
    const { count: pendingSupport } = await supabase
      .from('support_messages')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')

    // Get today's registrations
    const { count: todayRegistrations } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today)

    return {
      totalUsers: totalUsers || 0,
      activeUsers,
      todayRecords: todayRecords || 0,
      pendingSupport: pendingSupport || 0,
      todayRegistrations: todayRegistrations || 0
    }
  } catch (error) {
    console.error('Error getting dashboard analytics:', error)
    throw error
  }
}
