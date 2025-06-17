# 🚨 Panduan Mengatasi Error Database

## Error 1: Permission Denied
```
ERROR: 42501: permission denied to set parameter "app.jwt_secret"
```
**✅ Solusi**: Gunakan file step-by-step, jangan gunakan `supabase-schema.sql`

## Error 2: ON CONFLICT Specification
```
ERROR: 42P10: there is no unique or exclusion constraint matching the ON CONFLICT specification
```
**✅ Solusi**: Gunakan `supabase-setup-step3-simple.sql` instead of `supabase-setup-step3.sql`

---

## 🔧 Langkah Setup yang Benar:

### Step 1: Buat Tabel ✅
```sql
-- File: supabase-setup-step1.sql
-- Copy paste dan RUN
```

### Step 2: Setup Security ✅
```sql
-- File: supabase-setup-step2.sql
-- Copy paste dan RUN
```

### Step 3: Data Default ⚠️
```sql
-- File: supabase-setup-step3-simple.sql (GUNAKAN INI)
-- JANGAN gunakan supabase-setup-step3.sql
-- Copy paste dan RUN
```

### Step 4: Functions & Triggers ✅
```sql
-- File: supabase-setup-step4.sql
-- Copy paste dan RUN
```

---

## 🎯 Verifikasi Setup Berhasil:

### 1. Cek Table Editor
Pastikan tabel berikut ada:
- ✅ profiles
- ✅ ibadah_types (16 rows)
- ✅ user_ibadah
- ✅ ibadah_records
- ✅ support_messages
- ✅ ramadhan_content

### 2. Cek Data Default
Di tabel `ibadah_types` harus ada 16 rows:
- 10 ibadah harian (is_ramadhan_only = false)
- 6 ibadah Ramadhan (is_ramadhan_only = true)

### 3. Test Registrasi
1. Buka `http://localhost:3001/register`
2. Daftar dengan email valid
3. Cek email konfirmasi
4. Login ke dashboard

---

## 🔄 Jika Masih Error:

### Reset Database (Jika Diperlukan)
```sql
-- Hapus semua tabel (HATI-HATI!)
DROP TABLE IF EXISTS public.ibadah_records CASCADE;
DROP TABLE IF EXISTS public.user_ibadah CASCADE;
DROP TABLE IF EXISTS public.support_messages CASCADE;
DROP TABLE IF EXISTS public.ramadhan_content CASCADE;
DROP TABLE IF EXISTS public.ibadah_types CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Hapus functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
```

Lalu jalankan ulang Step 1-4.

---

## 📞 Troubleshooting Lanjutan:

### Error: "relation does not exist"
- Pastikan Step 1 berhasil dijalankan
- Cek di Table Editor apakah tabel sudah terbuat

### Error: "function does not exist"
- Pastikan Step 4 berhasil dijalankan
- Cek di Database > Functions apakah function sudah ada

### Error: "permission denied for table"
- Pastikan Step 2 berhasil dijalankan
- Cek di Authentication > Policies apakah RLS policies sudah ada

### Dashboard kosong setelah login
- Pastikan Step 3 berhasil dan ada 16 rows di ibadah_types
- Pastikan trigger handle_new_user berjalan (Step 4)
- Cek di tabel user_ibadah apakah ada data untuk user Anda

---

## ✅ Hasil Akhir yang Diharapkan:

Setelah setup berhasil:
1. **Registrasi** → Auto-create profile + default ibadah
2. **Login** → Dashboard menampilkan 10 ibadah harian
3. **Tracking** → Bisa centang/update progress
4. **Tambah Ibadah** → Bisa buat ibadah custom
5. **Support** → Bisa kirim pesan support

Jika semua langkah diikuti dengan benar, aplikasi akan berfungsi sempurna! 🚀
