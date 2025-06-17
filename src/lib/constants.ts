export const APP_NAME = 'ISTIQOMAH'
export const APP_TAGLINE = 'Muslim Habit Tracker'
export const APP_DESCRIPTION = 'Aplikasi untuk membantu Muslim melacak dan meningkatkan konsistensi ibadah harian'

export const ROUTES = {
  // Public routes
  HOME: '/',

  // Auth routes
  LOGIN: '/login',
  REGISTER: '/register',
  VERIFY: '/verify',

  // Protected routes
  DASHBOARD: '/dashboard',
  TAMBAH_IBADAH: '/tambah-ibadah',
  KELOLA_IBADAH: '/kelola-ibadah',
  RECORD_IBADAH: '/record-ibadah',
  MUHASABAH: '/muhasabah',
  MUHASABAH_JURNAL: '/muhasabah/jurnal',
  DATABASE_CHECK: '/database-check',
  TEST_MUHASABAH: '/test-muhasabah',
  RAMADHAN: '/ramadhan',
  LAPORAN: '/laporan',
  SUPPORT: '/support',
  PROFIL: '/profil',

  // Admin routes
  ADMIN_LOGIN: '/admin/login',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_USERS: '/admin/users',
  ADMIN_IBADAH: '/admin/ibadah',
  ADMIN_SUPPORT: '/admin/support',
  ADMIN_RAMADHAN: '/admin/ramadhan',
  ADMIN_STATISTICS: '/admin/statistics',
  ADMIN_SETTINGS: '/admin/settings',
} as const

export const DEFAULT_IBADAH_TYPES = [
  {
    name: 'Salat Subuh',
    description: 'Salat wajib subuh',
    tracking_type: 'checklist' as const,
    frequency: 'daily' as const,
    is_default: true,
    is_ramadhan_only: false,
  },
  {
    name: 'Salat Dzuhur',
    description: 'Salat wajib dzuhur',
    tracking_type: 'checklist' as const,
    frequency: 'daily' as const,
    is_default: true,
    is_ramadhan_only: false,
  },
  {
    name: 'Salat Ashar',
    description: 'Salat wajib ashar',
    tracking_type: 'checklist' as const,
    frequency: 'daily' as const,
    is_default: true,
    is_ramadhan_only: false,
  },
  {
    name: 'Salat Maghrib',
    description: 'Salat wajib maghrib',
    tracking_type: 'checklist' as const,
    frequency: 'daily' as const,
    is_default: true,
    is_ramadhan_only: false,
  },
  {
    name: 'Salat Isya',
    description: 'Salat wajib isya',
    tracking_type: 'checklist' as const,
    frequency: 'daily' as const,
    is_default: true,
    is_ramadhan_only: false,
  },
  {
    name: 'Tilawah Al-Quran',
    description: 'Membaca Al-Quran',
    tracking_type: 'count' as const,
    frequency: 'daily' as const,
    is_default: true,
    is_ramadhan_only: false,
  },
  {
    name: 'Dzikir Pagi',
    description: 'Dzikir setelah salat subuh',
    tracking_type: 'checklist' as const,
    frequency: 'daily' as const,
    is_default: true,
    is_ramadhan_only: false,
  },
  {
    name: 'Dzikir Sore',
    description: 'Dzikir setelah salat ashar',
    tracking_type: 'checklist' as const,
    frequency: 'daily' as const,
    is_default: true,
    is_ramadhan_only: false,
  },
  {
    name: 'Istighfar',
    description: 'Membaca istighfar',
    tracking_type: 'count' as const,
    frequency: 'daily' as const,
    is_default: true,
    is_ramadhan_only: false,
  },
  {
    name: 'Sedekah',
    description: 'Memberikan sedekah',
    tracking_type: 'checklist' as const,
    frequency: 'daily' as const,
    is_default: true,
    is_ramadhan_only: false,
  },
] as const

export const RAMADHAN_IBADAH_TYPES = [
  {
    name: 'Sahur',
    description: 'Makan sahur sebelum imsak',
    tracking_type: 'checklist' as const,
    frequency: 'daily' as const,
    is_default: true,
    is_ramadhan_only: true,
  },
  {
    name: 'Puasa',
    description: 'Menjalankan puasa Ramadhan',
    tracking_type: 'checklist' as const,
    frequency: 'daily' as const,
    is_default: true,
    is_ramadhan_only: true,
  },
  {
    name: 'Buka Puasa',
    description: 'Berbuka puasa tepat waktu',
    tracking_type: 'checklist' as const,
    frequency: 'daily' as const,
    is_default: true,
    is_ramadhan_only: true,
  },
  {
    name: 'Salat Tarawih',
    description: 'Salat tarawih di masjid atau rumah',
    tracking_type: 'checklist' as const,
    frequency: 'daily' as const,
    is_default: true,
    is_ramadhan_only: true,
  },
  {
    name: 'Tadarus Al-Quran',
    description: 'Membaca Al-Quran untuk khatam',
    tracking_type: 'count' as const,
    frequency: 'daily' as const,
    is_default: true,
    is_ramadhan_only: true,
  },
  {
    name: 'Sedekah Ramadhan',
    description: 'Sedekah khusus bulan Ramadhan',
    tracking_type: 'count' as const,
    frequency: 'daily' as const,
    is_default: true,
    is_ramadhan_only: true,
  },
] as const

export const SUPPORT_CATEGORIES = [
  'Masalah Teknis',
  'Pertanyaan Fitur',
  'Saran Perbaikan',
  'Laporan Bug',
  'Lainnya',
] as const

export const SUPPORT_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  CLOSED: 'closed',
} as const

export const TRACKING_TYPES = {
  CHECKLIST: 'checklist',
  COUNT: 'count',
} as const

export const FREQUENCIES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
} as const

export const COLORS = {
  PRIMARY: '#059669', // emerald-600
  SECONDARY: '#0d9488', // teal-600
  SUCCESS: '#16a34a', // green-600
  WARNING: '#d97706', // amber-600
  ERROR: '#dc2626', // red-600
  INFO: '#2563eb', // blue-600
} as const
