# 🛡️ ADMIN SYSTEM - ISTIQOMAH

## 🎯 Overview

Sistem admin ISTIQOMAH memberikan akses penuh kepada tim pengelola untuk mengelola aplikasi, pengguna, dan konten. Admin memiliki portal terpisah dengan fitur-fitur khusus untuk monitoring dan manajemen.

---

## 🔧 Setup Admin System

### Step 1: Setup Database Admin
Jalankan SQL script tambahan untuk admin:
```sql
-- File: supabase-admin-setup.sql
-- Jalankan setelah setup utama selesai
```

### Step 2: Buat Admin User
```sql
-- Update user menjadi admin (ganti dengan email Anda)
UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'admin@istiqomah.app';
```

### Step 3: Test Admin Access
1. Buka `/admin/login`
2. Login dengan akun admin
3. Akan redirect ke admin dashboard

---

## 🚪 Admin Authentication

### Perbedaan User vs Admin Login

#### 👤 **User Login** (`/login`)
- Akses ke dashboard user biasa
- Fitur tracking ibadah personal
- Support system sebagai user
- Laporan personal

#### 🛡️ **Admin Login** (`/admin/login`)
- Akses ke admin portal
- Kelola semua data pengguna
- Manajemen konten dan sistem
- Monitoring aplikasi

### Security Features
- **Middleware Protection**: Route `/admin/*` dilindungi middleware
- **Role-based Access**: Cek `is_admin = true` di database
- **Separate Authentication**: Admin login terpisah dari user
- **Auto-redirect**: Admin otomatis ke admin dashboard

---

## 📊 Admin Portal Features

### 🏠 **Admin Dashboard** (`/admin/dashboard`)
- **System Overview**: Total users, active users, records hari ini
- **Real-time Stats**: Monitoring aktivitas terbaru
- **System Health**: Status kesehatan aplikasi
- **Quick Actions**: Akses cepat ke fitur utama

### 👥 **User Management** (`/admin/users`)
- **User List**: Semua pengguna dengan pagination
- **User Details**: Progress dan aktivitas per user
- **Role Management**: Promote/demote admin
- **User Analytics**: Statistik penggunaan per user

### 💬 **Support Management** (`/admin/support`)
- **Ticket List**: Semua pesan support dengan filter status
- **Reply System**: Balas pesan support dari admin
- **Status Management**: Update status (open/in_progress/closed)
- **Category Analytics**: Statistik per kategori masalah

### 🌙 **Ramadhan Content** (`/admin/ramadhan`)
- **Content Calendar**: Konten harian Ramadhan
- **Bulk Upload**: Upload konten dalam batch
- **Content Editor**: Edit ayat, hadis, tips, doa
- **Preview System**: Preview konten sebelum publish

### 📈 **Statistics** (`/admin/statistics`)
- **User Growth**: Grafik pertumbuhan pengguna
- **Activity Trends**: Trend aktivitas tracking
- **Feature Usage**: Statistik penggunaan fitur
- **Performance Metrics**: Metrik performa aplikasi

### ⚙️ **Settings** (`/admin/settings`)
- **App Configuration**: Tagline, welcome message, dll
- **Feature Toggles**: Enable/disable fitur tertentu
- **Maintenance Mode**: Mode maintenance aplikasi
- **Backup Settings**: Konfigurasi backup data

---

## 🗄️ Database Schema Admin

### New Tables
```sql
-- Admin settings untuk konfigurasi global
admin_settings (
  id, key, value, description, created_at, updated_at
)

-- Statistik aplikasi harian
app_statistics (
  id, date, total_users, active_users, 
  total_records, total_support_messages, created_at, updated_at
)
```

### Updated Policies
- **Admin Full Access**: Admin bisa akses semua data
- **User Isolation**: User tetap hanya bisa akses data sendiri
- **Admin-only Tables**: Tabel admin hanya bisa diakses admin

---

## 🔐 Security & Permissions

### Role-based Access Control
```typescript
// Middleware check
if (request.nextUrl.pathname.startsWith('/admin')) {
  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) {
    // Redirect to admin login with error
    return NextResponse.redirect('/admin/login?error=unauthorized')
  }
}
```

### Database Policies
```sql
-- Example: Only admins can view all support messages
CREATE POLICY "Admins can view all support messages" 
ON public.support_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);
```

---

## 🚀 Admin Workflow

### Daily Admin Tasks
1. **Check Dashboard**: Review daily stats dan system health
2. **Handle Support**: Balas pesan support yang pending
3. **Monitor Users**: Cek aktivitas user dan anomali
4. **Update Content**: Update konten Ramadhan jika diperlukan

### Weekly Admin Tasks
1. **Review Statistics**: Analisis trend mingguan
2. **User Management**: Review user baru dan aktivitas
3. **System Maintenance**: Backup data dan health check
4. **Content Planning**: Plan konten untuk minggu depan

### Monthly Admin Tasks
1. **Performance Review**: Analisis performa aplikasi
2. **Feature Planning**: Plan fitur baru berdasarkan feedback
3. **Data Cleanup**: Cleanup data lama jika diperlukan
4. **Security Audit**: Review security dan permissions

---

## 🛠️ Admin API Functions

### User Management
```typescript
// Get all users with pagination
const { users, total } = await getAllUsers(page, limit)

// Get user progress
const progress = await getUserProgress(userId, days)

// Update user admin status
await updateUserStatus(userId, isAdmin)
```

### Support Management
```typescript
// Get all support messages
const messages = await getAllSupportMessages(status)

// Reply to support message
await updateSupportMessage(id, { 
  status: 'closed', 
  admin_reply: 'Issue resolved' 
})
```

### Content Management
```typescript
// Get Ramadhan content
const content = await getRamadhanContent()

// Update content
await upsertRamadhanContent({
  date: '2024-03-15',
  ayat: 'Al-Baqarah: 183',
  tips: 'Tips puasa hari ini'
})
```

---

## 📱 Admin Mobile Experience

Admin portal fully responsive:
- **Mobile Dashboard**: Optimized untuk mobile admin
- **Touch-friendly**: Interface yang mudah digunakan di mobile
- **Offline Capability**: Basic offline functionality
- **Push Notifications**: Notifikasi untuk admin (future)

---

## 🔄 Admin vs User Navigation

### User Flow
```
Landing Page → User Login → User Dashboard → User Features
```

### Admin Flow
```
Landing Page → Admin Login → Admin Dashboard → Admin Features
                    ↓
              Admin dapat akses User Dashboard juga
```

### Cross-navigation
- **Admin → User**: Admin bisa "View as User" untuk testing
- **User → Admin**: User biasa tidak bisa akses admin
- **Logout**: Terpisah antara admin dan user session

---

## 🎯 Admin Success Metrics

### Key Performance Indicators
- **Response Time**: Waktu respon support < 24 jam
- **User Satisfaction**: Rating support > 4.5/5
- **System Uptime**: > 99.9% availability
- **Data Integrity**: 0 data loss incidents

### Monitoring Dashboard
- **Real-time Alerts**: Notifikasi untuk issues critical
- **Performance Metrics**: Response time, error rates
- **User Engagement**: Daily/weekly active users
- **Feature Adoption**: Usage statistics per fitur

---

## 🎉 Kesimpulan

Sistem admin ISTIQOMAH memberikan kontrol penuh kepada tim pengelola untuk:
- ✅ **Mengelola pengguna** dan progress mereka
- ✅ **Menangani support** dengan efisien
- ✅ **Mengupdate konten** Ramadhan dan ibadah
- ✅ **Monitoring sistem** secara real-time
- ✅ **Konfigurasi aplikasi** sesuai kebutuhan

Portal admin yang terpisah memastikan **security**, **scalability**, dan **ease of management** untuk tim ISTIQOMAH! 🚀
