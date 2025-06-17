# 🚀 Panduan Deploy ISTIQOMAH ke Netlify

## Persiapan Sebelum Deploy

### 1. Pastikan Database Supabase Sudah Siap
- ✅ Semua tabel sudah dibuat
- ✅ RLS policies sudah dikonfigurasi
- ✅ Admin user sudah ada (is_admin = true)
- ✅ Default ibadah types sudah diinsert

### 2. Environment Variables yang Diperlukan
```env
NEXT_PUBLIC_SUPABASE_URL=https://ogxciarfjvtjyxjsndin.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://your-app.netlify.app
NEXT_PUBLIC_APP_NAME=ISTIQOMAH
ADMIN_EMAIL=admin@yourdomain.com
```

## Langkah-langkah Deploy ke Netlify

### Metode 1: Deploy via Git (Recommended)

1. **Push ke GitHub/GitLab**
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

2. **Connect ke Netlify**
   - Login ke [netlify.com](https://netlify.com)
   - Klik "New site from Git"
   - Pilih repository Anda
   - Branch: `main`
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Set Environment Variables**
   - Go to Site settings > Environment variables
   - Add semua environment variables dari .env.local

### Metode 2: Deploy Manual

1. **Build Locally**
   ```bash
   npm run build
   ```

2. **Deploy ke Netlify**
   - Drag & drop folder `.next` ke netlify.com/drop

## Konfigurasi Setelah Deploy

### 1. Update Supabase URL Redirect
Di Supabase Dashboard > Authentication > URL Configuration:
- Site URL: `https://your-app.netlify.app`
- Redirect URLs: `https://your-app.netlify.app/auth/callback`

### 2. Update Environment Variables
Ganti `NEXT_PUBLIC_APP_URL` dengan URL Netlify yang sebenarnya.

### 3. Test Fitur Utama
- ✅ Login/Register
- ✅ Dashboard user
- ✅ Admin dashboard
- ✅ Tracking ibadah
- ✅ Reports PDF
- ✅ Muhasabah

## Troubleshooting

### Build Errors
```bash
# Clear cache dan rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Environment Variables Issues
- Pastikan semua env vars dimulai dengan `NEXT_PUBLIC_` untuk client-side
- Restart deployment setelah update env vars

### Supabase Connection Issues
- Periksa CORS settings di Supabase
- Pastikan RLS policies sudah benar
- Check network tab di browser untuk error details

## Performance Optimization

### 1. Enable Netlify Analytics
- Site settings > Analytics > Enable

### 2. Enable Asset Optimization
- Site settings > Build & deploy > Asset optimization > Enable all

### 3. Configure Caching
Headers sudah dikonfigurasi di `netlify.toml`

## Security Checklist

- ✅ Environment variables tidak di-commit ke Git
- ✅ Supabase RLS policies aktif
- ✅ HTTPS enforced
- ✅ Security headers dikonfigurasi
- ✅ Admin access terbatas

## Monitoring

### 1. Netlify Functions Logs
- Functions tab di Netlify dashboard

### 2. Supabase Logs
- Logs & Analytics di Supabase dashboard

### 3. Error Tracking
- Check browser console untuk client-side errors
- Monitor Netlify deploy logs

## Custom Domain (Optional)

1. **Add Custom Domain**
   - Site settings > Domain management
   - Add custom domain

2. **Configure DNS**
   - Point domain ke Netlify
   - Enable HTTPS

3. **Update Environment Variables**
   - Update `NEXT_PUBLIC_APP_URL`
   - Update Supabase redirect URLs
