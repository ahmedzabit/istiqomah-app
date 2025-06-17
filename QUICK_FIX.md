# 🚨 Quick Fix untuk Error Permission

## Error yang Anda Alami:
```
ERROR: 42501: permission denied to set parameter "app.jwt_secret"
```

## ✅ Solusi Cepat:

### 1. Jangan Gunakan File Lama
- ❌ **JANGAN** gunakan `supabase-schema.sql`
- ✅ **GUNAKAN** file baru: `supabase-setup-step1.sql` sampai `step4.sql`

### 2. Jalankan Step by Step

#### Step 1: Buat Tabel
```sql
-- Copy paste isi file: supabase-setup-step1.sql
-- Klik RUN di SQL Editor
```

#### Step 2: Setup Security
```sql
-- Copy paste isi file: supabase-setup-step2.sql
-- Klik RUN di SQL Editor
```

#### Step 3: Data Default
```sql
-- PILIH SALAH SATU:
-- Option A: supabase-setup-step3.sql (advanced)
-- Option B: supabase-setup-step3-simple.sql (recommended)
-- Copy paste isi file dan klik RUN di SQL Editor
```

#### Step 4: Functions & Triggers
```sql
-- Copy paste isi file: supabase-setup-step4.sql
-- Klik RUN di SQL Editor
```

### 3. Verifikasi Setup
Setelah semua step selesai, cek di **Table Editor**:
- ✅ profiles
- ✅ ibadah_types (16 rows)
- ✅ user_ibadah
- ✅ ibadah_records
- ✅ support_messages
- ✅ ramadhan_content

### 4. Test Aplikasi
1. Buka `http://localhost:3001/register`
2. Daftar dengan email valid
3. Cek email untuk konfirmasi
4. Login dan test dashboard

## 🎯 Kenapa Error Terjadi?

File `supabase-schema.sql` yang lama mencoba mengatur parameter database yang hanya bisa diakses oleh super admin. Supabase managed hosting tidak mengizinkan ini.

File baru sudah diperbaiki dan tidak menggunakan perintah yang bermasalah.

## 📞 Jika Masih Error:

1. **Refresh Supabase Dashboard**
2. **Pastikan project aktif**
3. **Coba jalankan satu step dulu untuk test**
4. **Cek di Table Editor apakah tabel terbuat**

Setelah setup berhasil, aplikasi akan langsung bisa digunakan! 🚀
