import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isToday, isThisWeek, isThisMonth, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import { id } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string, formatStr: string = 'dd MMMM yyyy'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, formatStr, { locale: id })
}

export function formatDateForDB(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function isDateToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return isToday(dateObj)
}

export function isDateThisWeek(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return isThisWeek(dateObj, { weekStartsOn: 1 }) // Monday as start of week
}

export function isDateThisMonth(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return isThisMonth(dateObj)
}

export function getWeekDates(date: Date = new Date()): Date[] {
  const start = startOfWeek(date, { weekStartsOn: 1 })
  const end = endOfWeek(date, { weekStartsOn: 1 })
  return eachDayOfInterval({ start, end })
}

export function isRamadhanMonth(): boolean {
  // This is a simplified check - in real app, you'd want to use proper Islamic calendar
  // For now, we'll use a manual check or configuration
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()

  // You would need to update these dates each year or use an Islamic calendar library
  // These are approximate dates for Ramadhan 2025
  const ramadhanStart = new Date(2025, 2, 1) // March 1, 2025 (approximate)
  const ramadhanEnd = new Date(2025, 2, 30)   // March 30, 2025 (approximate)

  return currentDate >= ramadhanStart && currentDate <= ramadhanEnd
}

export function getRamadhanInfo() {
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()

  // Ramadhan dates for different years (approximate - should be updated with accurate Islamic calendar)
  const ramadhanDates: { [year: number]: { start: Date; end: Date } } = {
    2024: {
      start: new Date(2024, 2, 11), // March 11, 2024
      end: new Date(2024, 3, 9)     // April 9, 2024
    },
    2025: {
      start: new Date(2025, 1, 28), // February 28, 2025
      end: new Date(2025, 2, 29)    // March 29, 2025
    },
    2026: {
      start: new Date(2026, 1, 17), // February 17, 2026
      end: new Date(2026, 2, 18)    // March 18, 2026
    }
  }

  const yearData = ramadhanDates[currentYear]
  if (!yearData) {
    return {
      isRamadhan: false,
      currentDay: 0,
      totalDays: 30,
      daysRemaining: 0,
      startDate: null,
      endDate: null
    }
  }

  const { start, end } = yearData
  const isRamadhan = currentDate >= start && currentDate <= end

  if (!isRamadhan) {
    return {
      isRamadhan: false,
      currentDay: 0,
      totalDays: 30,
      daysRemaining: 0,
      startDate: start,
      endDate: end
    }
  }

  const daysDiff = Math.floor((currentDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  const currentDay = Math.max(1, Math.min(30, daysDiff + 1))
  const totalDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  const daysRemaining = Math.max(0, totalDays - currentDay + 1)

  return {
    isRamadhan: true,
    currentDay,
    totalDays,
    daysRemaining,
    startDate: start,
    endDate: end
  }
}

export function formatIslamicGreeting(hour?: number): string {
  const currentHour = hour ?? new Date().getHours()

  if (currentHour < 5) return 'Selamat Malam' // Late night
  if (currentHour < 12) return 'Selamat Pagi' // Morning
  if (currentHour < 15) return 'Selamat Siang' // Afternoon
  if (currentHour < 18) return 'Selamat Sore' // Evening
  if (currentHour < 20) return 'Selamat Maghrib' // Maghrib time
  return 'Selamat Malam' // Night
}

export function getPrayerTimeGreeting(): string {
  const hour = new Date().getHours()

  if (hour >= 4 && hour < 6) return 'Waktu Sahur'
  if (hour >= 5 && hour < 7) return 'Waktu Subuh'
  if (hour >= 12 && hour < 13) return 'Waktu Dzuhur'
  if (hour >= 15 && hour < 16) return 'Waktu Ashar'
  if (hour >= 18 && hour < 19) return 'Waktu Maghrib'
  if (hour >= 19 && hour < 21) return 'Waktu Isya'

  return formatIslamicGreeting(hour)
}

export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

export function getGreeting(): string {
  const hour = new Date().getHours()
  
  if (hour < 5) return 'Selamat malam'
  if (hour < 12) return 'Selamat pagi'
  if (hour < 15) return 'Selamat siang'
  if (hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password minimal 8 karakter')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password harus mengandung huruf besar')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password harus mengandung huruf kecil')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password harus mengandung angka')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
