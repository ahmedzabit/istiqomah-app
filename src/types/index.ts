import { Database } from './database'

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Type aliases for easier use
export type Profile = Tables<'profiles'>
export type IbadahType = Tables<'ibadah_types'>
export type UserIbadah = Tables<'user_ibadah'>
export type IbadahRecord = Tables<'ibadah_records'>
export type RamadhanContent = Tables<'ramadhan_content'>
export type SupportMessage = Tables<'support_messages'>
export type MuhasabahEntry = Tables<'muhasabah_entries'>

// Extended types with relations
export type IbadahTypeWithRecords = IbadahType & {
  ibadah_records?: IbadahRecord[]
  user_ibadah?: UserIbadah[]
}

export type DashboardData = {
  todayRecords: IbadahRecord[]
  ibadahTypes: IbadahType[]
  userIbadah: UserIbadah[]
  weeklyProgress: {
    date: string
    completed: number
    total: number
  }[]
}

export type ReportData = {
  dateRange: {
    from: string
    to: string
  }
  records: IbadahRecord[]
  ibadahTypes: IbadahType[]
  summary: {
    totalDays: number
    completedDays: number
    averageCompletion: number
    mostConsistent: string[]
    needsImprovement: string[]
  }
}

// Form types
export type LoginForm = {
  email: string
  password: string
}

export type RegisterForm = {
  email: string
  password: string
  confirmPassword: string
  fullName: string
}

export type IbadahForm = {
  name: string
  description?: string
  trackingType: 'checklist' | 'count'
  frequency: 'daily' | 'weekly' | 'monthly'
  targetCount?: number
}

export type SupportForm = {
  subject: string
  message: string
}
