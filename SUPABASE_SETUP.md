# Setup Database Supabase untuk ISTIQOMAH

## 🚀 Langkah-langkah Setup

### 1. Login ke Supabase Dashboard
- Buka [https://supabase.com](https://supabase.com)
- Login dengan akun Anda
- Pilih project: **ogxciarfjvtjyxjsndin**

### 2. Setup Database Schema (Step by Step)
Jalankan file SQL berikut secara berurutan di **SQL Editor** Supabase:

#### Step 1: Create Tables
1. Buka **SQL Editor** di dashboard Supabase
2. Copy dan paste isi file `supabase-setup-step1.sql`
3. Klik **Run** untuk membuat semua tabel

#### Step 2: Enable RLS & Policies
1. Copy dan paste isi file `supabase-setup-step2.sql`
2. Klik **Run** untuk mengaktifkan Row Level Security

#### Step 3: Insert Default Data
1. Copy dan paste isi file `supabase-setup-step3.sql`
2. Klik **Run** untuk menambahkan data ibadah default

#### Step 4: Create Functions & Triggers
1. Copy dan paste isi file `supabase-setup-step4.sql`
2. Klik **Run** untuk membuat functions dan triggers

### 3. Verifikasi Setup
Setelah menjalankan script, pastikan tabel-tabel berikut telah dibuat:

#### ✅ Tables Created:
- `profiles` - Data profil user
- `ibadah_types` - Jenis-jenis ibadah
- `user_ibadah` - Relasi user dengan ibadah
- `ibadah_records` - Record tracking harian
- `support_messages` - Pesan support
- `ramadhan_content` - Konten Ramadhan

#### ✅ Functions Created:
- `handle_new_user()` - Auto-create profile saat registrasi
- `update_updated_at_column()` - Auto-update timestamp

#### ✅ Triggers Created:
- Auto-create profile untuk user baru
- Auto-update timestamp untuk semua tabel

#### ✅ RLS Policies:
- User hanya bisa akses data mereka sendiri
- Admin bisa akses semua data
- Public bisa baca konten Ramadhan

### 4. Test Authentication
1. Buka aplikasi di `http://localhost:3001`
2. Klik **Daftar** untuk registrasi
3. Isi form registrasi dengan data valid
4. Cek email untuk konfirmasi (dari Supabase Auth)
5. Klik link konfirmasi di email
6. Login dengan akun yang sudah dikonfirmasi

### 5. Test Fitur Aplikasi

#### ✅ Dashboard
- Setelah login, Anda akan melihat dashboard
- Default ibadah sudah otomatis ditambahkan
- Progress ring menunjukkan 0% (belum ada tracking)

#### ✅ Tambah Ibadah
- Klik **Tambah Ibadah** 
- Isi form dengan ibadah custom
- Pilih jenis tracking (checklist/count)
- Ibadah baru akan muncul di dashboard

#### ✅ Tracking Harian
- Di dashboard, klik checkbox untuk ibadah checklist
- Klik tombol +/- untuk ibadah count
- Progress akan terupdate real-time
- Data tersimpan di database

#### ✅ Support System
- Buka menu **Support**
- Pilih kategori masalah
- Kirim pesan support
- Pesan akan tersimpan dan muncul di riwayat

### 6. Data Default yang Tersedia

Setelah setup, database akan memiliki ibadah default:

#### 📿 Ibadah Harian:
- Salat Subuh (checklist)
- Salat Dzuhur (checklist)
- Salat Ashar (checklist)
- Salat Maghrib (checklist)
- Salat Isya (checklist)
- Tilawah Al-Quran (count, target: 5)
- Dzikir Pagi (checklist)
- Dzikir Sore (checklist)
- Istighfar (count, target: 100)
- Sedekah (checklist)

#### 🌙 Ibadah Ramadhan:
- Sahur (checklist)
- Puasa (checklist)
- Buka Puasa (checklist)
- Salat Tarawih (checklist)
- Tadarus Al-Quran (count)
- Sedekah Ramadhan (count)

### 7. Troubleshooting

#### ❌ Error: "permission denied to set parameter"
- **Solusi**: Gunakan file setup step-by-step (`supabase-setup-step1.sql` sampai `step4.sql`)
- Jangan gunakan `supabase-schema.sql` yang lama
- Jalankan satu per satu sesuai urutan

#### ❌ Error: "User not authenticated"
- Pastikan sudah login
- Cek apakah email sudah dikonfirmasi
- Refresh halaman dan login ulang

#### ❌ Error: "Failed to load dashboard data"
- Cek koneksi internet
- Pastikan Supabase project aktif
- Cek console browser untuk error detail

#### ❌ Error: "Permission denied"
- Pastikan RLS policies sudah dijalankan
- Cek apakah user ID sesuai dengan auth.uid()

#### ❌ Ibadah default tidak muncul
- Cek apakah trigger `handle_new_user` berjalan
- Manual insert ke `user_ibadah` jika perlu:

```sql
INSERT INTO user_ibadah (user_id, ibadah_type_id, target_count)
SELECT 
    'USER_ID_HERE',
    it.id,
    CASE 
        WHEN it.tracking_type = 'count' AND it.name = 'Tilawah Al-Quran' THEN 5
        WHEN it.tracking_type = 'count' AND it.name = 'Istighfar' THEN 100
        ELSE 1
    END
FROM ibadah_types it
WHERE it.is_default = true AND it.is_ramadhan_only = false;
```

### 8. Environment Variables

Pastikan file `.env.local` sudah benar:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ogxciarfjvtjyxjsndin.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9neGNpYXJmanZ0anl4anNuZGluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk0MjkxNjMsImV4cCI6MjA2NTAwNTE2M30.mvXK4Lxo8j2aYhT_0RrSktuXaFWXD6LsMqVRaVL7oZ0
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=ISTIQOMAH
ADMIN_EMAIL=admin@istiqomah.app
```

### 9. Next Steps

Setelah setup berhasil, Anda bisa:

1. **Customize Ibadah**: Tambah ibadah sesuai kebutuhan
2. **Test Tracking**: Coba tracking harian selama beberapa hari
3. **Generate Reports**: Lihat laporan progress (masih mock data)
4. **Add Ramadhan Content**: Isi konten harian Ramadhan
5. **Setup Admin**: Buat akun admin untuk mengelola konten

### 🎉 Selamat!

Aplikasi ISTIQOMAH sudah terintegrasi dengan Supabase dan siap digunakan untuk tracking ibadah harian. Semoga bermanfaat untuk meningkatkan kualitas ibadah kita semua! 🤲
