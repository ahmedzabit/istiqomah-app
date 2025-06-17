# 🆕 Fitur Baru: Penjadwalan Ibadah & Satuan Custom

## 📋 **Ringkasan Fitur**

Kami telah menambahkan dua fitur baru yang sangat berguna untuk tracking ibadah Anda:

### **1. 📅 Penjadwalan Ibadah**
Sekarang Anda dapat mengatur kapan ibadah tertentu akan muncul di dashboard:
- **Selalu Aktif** - Ibadah muncul setiap hari
- **Rentang Tanggal** - Ibadah hanya muncul dalam periode tertentu
- **Tanggal Tertentu** - Ibadah hanya muncul pada tanggal yang Anda pilih

### **2. 📊 Satuan Custom untuk Tracking Count**
Untuk ibadah dengan jenis pelacakan "Hitung", Anda sekarang dapat menentukan satuan:
- **Preset Satuan**: Ayat, Halaman, Lembar, Kali, Menit, Rupiah
- **Custom Satuan**: Tulis satuan sendiri sesuai kebutuhan

---

## 🚀 **Cara Menggunakan**

### **Menambah Ibadah dengan Penjadwalan**

1. **Buka halaman "Tambah Ibadah"**
2. **Isi informasi dasar** (nama, deskripsi, jenis pelacakan)
3. **Pilih jenis jadwal**:

   **📌 Selalu Aktif**
   - Pilih ini jika ibadah harus muncul setiap hari
   - Contoh: Salat 5 waktu, dzikir harian

   **📅 Rentang Tanggal**
   - Pilih tanggal mulai dan akhir
   - Contoh: Program tahfidz selama 3 bulan
   - Ibadah akan otomatis muncul/hilang sesuai tanggal

   **📋 Tanggal Tertentu**
   - Pilih tanggal-tanggal spesifik
   - Contoh: Puasa sunnah setiap Senin-Kamis
   - Klik tanggal untuk menambah, klik "×" untuk menghapus

### **Menggunakan Satuan Custom**

1. **Pilih jenis pelacakan "Hitung"**
2. **Isi target harian** (angka)
3. **Pilih atau tulis satuan**:
   - Gunakan dropdown untuk satuan umum
   - Atau tulis satuan custom di input field
   - Contoh: "juz", "surah", "ribu", "gram", dll

---

## 💡 **Contoh Penggunaan**

### **Contoh 1: Program Tahfidz**
```
Nama: Menghafal Al-Quran
Jenis: Hitung
Target: 5
Satuan: ayat
Jadwal: Rentang Tanggal (1 Jan - 31 Des 2024)
```

### **Contoh 2: Sedekah Ramadhan**
```
Nama: Sedekah Harian Ramadhan
Jenis: Hitung  
Target: 10000
Satuan: rupiah
Jadwal: Rentang Tanggal (sesuai bulan Ramadhan)
```

### **Contoh 3: Puasa Sunnah**
```
Nama: Puasa Senin-Kamis
Jenis: Checklist
Jadwal: Tanggal Tertentu (pilih semua Senin-Kamis)
```

### **Contoh 4: Olahraga Mingguan**
```
Nama: Olahraga Ringan
Jenis: Hitung
Target: 30
Satuan: menit
Jadwal: Tanggal Tertentu (pilih hari weekend)
```

---

## 🔧 **Setup Database**

**Untuk Admin/Developer:**

1. **Jalankan SQL Enhancement**:
   ```sql
   -- Jalankan file: database-enhancement-scheduling.sql
   -- Di Supabase SQL Editor
   ```

2. **Fitur akan otomatis aktif** setelah SQL dijalankan

---

## 📱 **Tampilan di Dashboard**

### **Habit Card dengan Satuan**
```
┌─────────────────────────────────┐
│ Tilawah Al-Quran          [-][2][+]│
│ Membaca Al-Quran setiap hari    │
│ ─────────────────────────────── │
│   Target: 5 ayat | Progress: 2/5 ayat │
└─────────────────────────────────┘
```

### **Penjadwalan Otomatis**
- Ibadah dengan jadwal "Rentang Tanggal" akan **otomatis muncul/hilang**
- Ibadah dengan "Tanggal Tertentu" hanya muncul pada hari yang dipilih
- **Tidak perlu manual aktifkan/nonaktifkan**

---

## 🎯 **Manfaat Fitur Baru**

### **Penjadwalan Ibadah**
✅ **Otomatisasi** - Tidak perlu manual mengatur ibadah musiman  
✅ **Fleksibilitas** - Sesuaikan dengan program ibadah Anda  
✅ **Fokus** - Dashboard hanya menampilkan ibadah yang relevan  
✅ **Ramadhan Ready** - Perfect untuk ibadah khusus Ramadhan  

### **Satuan Custom**
✅ **Clarity** - Jelas apa yang dihitung (ayat, rupiah, menit)  
✅ **Motivasi** - Target lebih spesifik dan terukur  
✅ **Fleksibilitas** - Bisa untuk berbagai jenis ibadah  
✅ **Tracking Akurat** - Progress lebih meaningful  

---

## 🔮 **Fitur Mendatang**

- **Notifikasi Penjadwalan** - Reminder sebelum ibadah dimulai/berakhir
- **Template Jadwal** - Preset untuk Ramadhan, Hajj, dll
- **Bulk Scheduling** - Atur banyak ibadah sekaligus
- **Smart Suggestions** - AI suggest jadwal berdasarkan pola

---

## 🆘 **Troubleshooting**

**Q: Ibadah tidak muncul sesuai jadwal?**  
A: Pastikan tanggal sistem benar dan refresh halaman

**Q: Satuan tidak tersimpan?**  
A: Pastikan mengisi satuan untuk jenis pelacakan "Hitung"

**Q: Error saat menyimpan jadwal?**  
A: Pastikan tanggal mulai tidak lebih besar dari tanggal akhir

**Q: Ibadah Ramadhan tidak otomatis?**  
A: Fitur Ramadhan otomatis diatur oleh admin, bukan user

---

## 📞 **Support**

Jika mengalami masalah atau butuh bantuan:
1. Gunakan fitur **Support** di aplikasi
2. Pilih kategori "Fitur Baru"
3. Jelaskan masalah dengan detail

**Selamat menggunakan fitur baru! Semoga ibadah Anda semakin teratur dan berkah! 🤲**
