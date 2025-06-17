# ISTIQOMAH - Muslim Habit Tracker

**Tagline:** *Muslim Habit Tracker*

Aplikasi web yang membantu pengguna Muslim dalam melacak, mengevaluasi, dan meningkatkan konsistensi ibadah hariannya. Aplikasi ini juga mencakup fitur khusus Ramadhan, sistem laporan PDF, dan sarana interaksi serta dukungan pengguna.

## 🌟 Fitur Utama

### 📊 Dashboard Interaktif
- **Progress Ring**: Visualisasi progress harian dengan circular progress bar
- **Habit Cards**: Kartu ibadah dengan tracking checklist atau count
- **Weekly Overview**: Ringkasan progress mingguan
- **Quick Actions**: Akses cepat ke fitur-fitur utama

### ✅ Tracking Ibadah Harian
- **Salat 5 Waktu**: Tracking salat wajib harian
- **Tilawah Al-Quran**: Tracking membaca Al-Quran dengan target halaman/ayat
- **Dzikir**: Tracking dzikir pagi dan sore
- **Sedekah**: Tracking amal sedekah harian
- **Custom Ibadah**: Tambah ibadah sesuai kebutuhan personal

### 📈 Laporan & Analisis
- **Progress Mingguan**: Visualisasi progress 7 hari terakhir
- **Statistik Bulanan**: Rata-rata completion, streak terbaik, dll
- **Export PDF**: Generate laporan detail dalam format PDF
- **Habit Performance**: Ranking ibadah terkonsisten

### 🌙 Fitur Ramadhan (Seasonal)
- **Checklist Ramadhan**: Sahur, puasa, buka puasa, tarawih
- **Target Khatam**: Tracking progress khatam Al-Quran
- **Inspirasi Harian**: Ayat, hadis, tips, dan doa harian
- **Sedekah Ramadhan**: Tracking sedekah khusus bulan suci

### 💬 Support System
- **Ticket System**: Sistem tiket untuk pertanyaan dan masalah
- **Kategori Support**: Technical, Feature, Bug Report, Suggestion
- **FAQ**: Pertanyaan yang sering diajukan
- **Response Tracking**: Status dan riwayat tiket

### 👤 Manajemen Profil
- **Profile Management**: Edit nama, email, dan informasi akun
- **Account Statistics**: Total ibadah, hari aktif, streak terbaik
- **Settings**: Notifikasi, backup data, preferensi

## 🛠 Tech Stack

- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Backend**: Supabase (Database + Auth + Storage)
- **UI Components**: Custom components dengan Headless UI patterns
- **Form Management**: React Hook Form + Zod validation
- **Icons**: Heroicons
- **PDF Generation**: jsPDF (planned)
- **Charts**: Custom progress rings dan visualisasi

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm atau yarn
- Akun Supabase

### Installation

1. **Clone repository**
```bash
git clone <repository-url>
cd istiqomah-app
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` dengan konfigurasi Supabase Anda:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=ISTIQOMAH
ADMIN_EMAIL=admin@istiqomah.app
```

4. **Setup Supabase Database**

Buat tabel-tabel berikut di Supabase:

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Ibadah types table
CREATE TABLE ibadah_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  tracking_type TEXT CHECK (tracking_type IN ('checklist', 'count')) NOT NULL,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly')) DEFAULT 'daily',
  is_default BOOLEAN DEFAULT FALSE,
  is_ramadhan_only BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User ibadah table
CREATE TABLE user_ibadah (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  ibadah_type_id UUID REFERENCES ibadah_types ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT TRUE,
  target_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ibadah records table
CREATE TABLE ibadah_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  ibadah_type_id UUID REFERENCES ibadah_types ON DELETE CASCADE,
  date DATE NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  count_value INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support messages table
CREATE TABLE support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT CHECK (status IN ('open', 'in_progress', 'closed')) DEFAULT 'open',
  admin_reply TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ramadhan content table
CREATE TABLE ramadhan_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  ayat TEXT,
  hadis TEXT,
  tips TEXT,
  doa TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

5. **Run development server**
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) untuk melihat aplikasi.

## 📱 Struktur Aplikasi

```
src/
├── app/
│   ├── (auth)/                 # Auth pages (login, register, verify)
│   ├── (dashboard)/            # Dashboard pages
│   │   ├── dashboard/          # Main dashboard
│   │   ├── tambah-ibadah/      # Add new habit
│   │   ├── ramadhan/           # Ramadhan features
│   │   ├── laporan/            # Reports & analytics
│   │   ├── support/            # Support system
│   │   └── profil/             # User profile
│   ├── admin/                  # Admin portal (planned)
│   └── api/                    # API routes (planned)
├── components/
│   ├── ui/                     # Reusable UI components
│   ├── dashboard/              # Dashboard-specific components
│   └── layout/                 # Layout components
├── lib/
│   ├── supabase/              # Supabase client configuration
│   ├── utils/                 # Utility functions
│   ├── validations/           # Zod schemas
│   └── constants/             # App constants
├── hooks/                     # Custom React hooks
├── types/                     # TypeScript type definitions
└── styles/                    # Global styles
```

## 🎨 Design System

Aplikasi menggunakan design system yang terinspirasi dari referensi modern habit tracker dengan:

- **Color Palette**: Purple, Green, Orange, Pink gradients
- **Typography**: System fonts dengan hierarchy yang jelas
- **Components**: Card-based layout dengan rounded corners
- **Progress Indicators**: Circular progress rings
- **Interactive Elements**: Hover states dan smooth transitions

## 🔐 Authentication Flow

1. **Registration**: User mendaftar dengan email dan password
2. **Email Verification**: Supabase mengirim email konfirmasi
3. **Login**: User login setelah verifikasi
4. **Dashboard Access**: Akses ke fitur-fitur utama
5. **Profile Management**: Edit profil dan pengaturan

## 📊 Data Flow

1. **Habit Creation**: User membuat ibadah baru
2. **Daily Tracking**: User update progress harian
3. **Data Storage**: Data disimpan di Supabase
4. **Analytics**: Kalkulasi statistik dan progress
5. **Reports**: Generate laporan PDF

## 🚧 Roadmap

### Phase 1 (Current)
- ✅ Basic authentication
- ✅ Dashboard dengan habit tracking
- ✅ Add custom habits
- ✅ Reports page
- ✅ Support system
- ✅ User profile

### Phase 2 (Planned)
- 🔄 Supabase integration
- 🔄 Real data persistence
- 🔄 PDF report generation
- 🔄 Ramadhan features
- 🔄 Admin portal

### Phase 3 (Future)
- 📱 Mobile app (React Native)
- 🔔 Push notifications
- 🌐 Multi-language support
- 📊 Advanced analytics
- 👥 Community features

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Contact

- **Email**: support@istiqomah.app
- **Website**: [istiqomah.app](https://istiqomah.app)
- **GitHub**: [github.com/istiqomah-app](https://github.com/istiqomah-app)

---

**Barakallahu fiikum** - Semoga aplikasi ini bermanfaat untuk meningkatkan kualitas ibadah kita semua. 🤲
