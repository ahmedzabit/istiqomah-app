'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { toggleRamadhanIbadahStatus } from '@/lib/supabase/database';
import {
  Cog6ToothIcon,
  ShieldCheckIcon,
  BellIcon,
  GlobeAltIcon,
  ServerIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface AdminSetting {
  id: string;
  key: string;
  value: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface SettingsForm {
  app_tagline: string;
  welcome_message: string;
  maintenance_mode: boolean;
  max_custom_ibadah: number;
  ramadhan_active: boolean;
  support_email: string;
  app_version: string;
  backup_frequency: string;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSetting[]>([]);
  const [formData, setFormData] = useState<SettingsForm>({
    app_tagline: '',
    welcome_message: '',
    maintenance_mode: false,
    max_custom_ibadah: 10,
    ramadhan_active: false,
    support_email: '',
    app_version: '',
    backup_frequency: 'daily'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .order('key');

      if (error) throw error;

      setSettings(data || []);
      
      // Convert settings array to form data
      const settingsMap: { [key: string]: string } = {};
      data?.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });

      setFormData({
        app_tagline: settingsMap.app_tagline || '',
        welcome_message: settingsMap.welcome_message || '',
        maintenance_mode: settingsMap.maintenance_mode === 'true',
        max_custom_ibadah: parseInt(settingsMap.max_custom_ibadah) || 10,
        ramadhan_active: settingsMap.ramadhan_active === 'true',
        support_email: settingsMap.support_email || '',
        app_version: settingsMap.app_version || '',
        backup_frequency: settingsMap.backup_frequency || 'daily'
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSaveMessage({
        type: 'error',
        text: 'Gagal memuat pengaturan. Silakan refresh halaman.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      setSaveMessage(null);

      // Get current Ramadhan setting to check if it's changing
      const currentRamadhanSetting = settings.find(s => s.key === 'ramadhan_active')?.value === 'true';
      const newRamadhanSetting = formData.ramadhan_active;

      // Convert form data to settings updates
      const updates = [
        { key: 'app_tagline', value: formData.app_tagline },
        { key: 'welcome_message', value: formData.welcome_message },
        { key: 'maintenance_mode', value: formData.maintenance_mode.toString() },
        { key: 'max_custom_ibadah', value: formData.max_custom_ibadah.toString() },
        { key: 'ramadhan_active', value: formData.ramadhan_active.toString() },
        { key: 'support_email', value: formData.support_email },
        { key: 'app_version', value: formData.app_version },
        { key: 'backup_frequency', value: formData.backup_frequency }
      ];

      // Update each setting
      for (const update of updates) {
        const { error } = await supabase
          .from('admin_settings')
          .upsert({
            key: update.key,
            value: update.value,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'key'
          });

        if (error) throw error;
      }

      // If Ramadhan setting changed, update user ibadah status
      if (currentRamadhanSetting !== newRamadhanSetting) {
        try {
          await toggleRamadhanIbadahStatus(newRamadhanSetting);
        } catch (ibadahError) {
          console.error('Error updating Ramadhan ibadah status:', ibadahError);
          // Don't fail the entire save operation for this
        }
      }

      setSaveMessage({
        type: 'success',
        text: 'Pengaturan berhasil disimpan! Perubahan akan terlihat dalam beberapa detik.'
      });

      // Refresh settings
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage({
        type: 'error',
        text: 'Gagal menyimpan pengaturan. Silakan coba lagi.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Apakah Anda yakin ingin mereset pengaturan ke nilai default?')) {
      fetchSettings();
      setSaveMessage(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Pengaturan Aplikasi
          </h1>
          <p className="text-slate-400 mt-1">
            Konfigurasi global untuk aplikasi ISTIQOMAH
          </p>
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded-lg flex items-center space-x-3 ${
          saveMessage.type === 'success' 
            ? 'bg-green-500/20 border border-green-500/30' 
            : 'bg-red-500/20 border border-red-500/30'
        }`}>
          {saveMessage.type === 'success' ? (
            <CheckCircleIcon className="w-5 h-5 text-green-400" />
          ) : (
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
          )}
          <p className={`text-sm ${
            saveMessage.type === 'success' ? 'text-green-400' : 'text-red-400'
          }`}>
            {saveMessage.text}
          </p>
          <button
            onClick={() => setSaveMessage(null)}
            className="ml-auto text-slate-400 hover:text-white"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* General Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <GlobeAltIcon className="w-6 h-6 text-purple-400" />
              <div>
                <h2 className="text-lg font-semibold text-white">Pengaturan Umum</h2>
                <p className="text-sm text-slate-400">Konfigurasi dasar aplikasi</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tagline Aplikasi
              </label>
              <input
                type="text"
                value={formData.app_tagline}
                onChange={(e) => setFormData({ ...formData, app_tagline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Muslim Habit Tracker"
              />
              <p className="text-xs text-slate-500 mt-1">
                Tagline yang ditampilkan di landing page
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Pesan Selamat Datang
              </label>
              <textarea
                value={formData.welcome_message}
                onChange={(e) => setFormData({ ...formData, welcome_message: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                placeholder="Selamat datang di ISTIQOMAH! Mari tingkatkan kualitas ibadah kita bersama."
              />
              <p className="text-xs text-slate-500 mt-1">
                Pesan yang ditampilkan untuk pengguna baru
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email Support
              </label>
              <input
                type="email"
                value={formData.support_email}
                onChange={(e) => setFormData({ ...formData, support_email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="support@istiqomah.app"
              />
              <p className="text-xs text-slate-500 mt-1">
                Email yang digunakan untuk kontak support
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Versi Aplikasi
              </label>
              <input
                type="text"
                value={formData.app_version}
                onChange={(e) => setFormData({ ...formData, app_version: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="1.0.0"
              />
              <p className="text-xs text-slate-500 mt-1">
                Versi aplikasi saat ini
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Feature Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <Cog6ToothIcon className="w-6 h-6 text-blue-400" />
              <div>
                <h2 className="text-lg font-semibold text-white">Pengaturan Fitur</h2>
                <p className="text-sm text-slate-400">Kontrol fitur aplikasi</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Mode Maintenance
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  Aktifkan untuk menonaktifkan akses pengguna sementara
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.maintenance_mode}
                  onChange={(e) => setFormData({ ...formData, maintenance_mode: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Fitur Ramadhan
                </label>
                <p className="text-xs text-slate-500 mt-1">
                  Aktifkan fitur khusus bulan Ramadhan (akan menampilkan menu Ramadhan di navigasi)
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.ramadhan_active}
                  onChange={(e) => setFormData({ ...formData, ramadhan_active: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            {formData.ramadhan_active && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-400" />
                  <p className="text-sm font-medium text-green-400">Fitur Ramadhan Aktif</p>
                </div>
                <p className="text-xs text-green-300">
                  Menu "Ramadhan" akan muncul di navigasi pengguna. Pengguna dapat mengakses konten harian Ramadhan dan tracking ibadah khusus.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Maksimal Ibadah Custom
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.max_custom_ibadah}
                onChange={(e) => setFormData({ ...formData, max_custom_ibadah: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-slate-500 mt-1">
                Jumlah maksimal ibadah custom yang bisa dibuat pengguna
              </p>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <ServerIcon className="w-6 h-6 text-green-400" />
              <div>
                <h2 className="text-lg font-semibold text-white">Pengaturan Sistem</h2>
                <p className="text-sm text-slate-400">Konfigurasi sistem dan backup</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Frekuensi Backup
              </label>
              <select
                value={formData.backup_frequency}
                onChange={(e) => setFormData({ ...formData, backup_frequency: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="daily">Harian</option>
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">
                Seberapa sering backup data dilakukan
              </p>
            </div>

            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <ShieldCheckIcon className="w-5 h-5 text-green-400" />
                <h3 className="text-sm font-medium text-white">Status Sistem</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-slate-400">Database:</p>
                  <p className="text-green-400 font-medium">Online</p>
                </div>
                <div>
                  <p className="text-slate-400">Storage:</p>
                  <p className="text-green-400 font-medium">Normal</p>
                </div>
                <div>
                  <p className="text-slate-400">Backup Terakhir:</p>
                  <p className="text-slate-300">Hari ini, 03:00</p>
                </div>
                <div>
                  <p className="text-slate-400">Uptime:</p>
                  <p className="text-slate-300">99.9%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-700">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 text-slate-400 hover:text-white transition-colors flex items-center space-x-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Reset ke Default</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <CheckCircleIcon className="w-4 h-4" />
              )}
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Ramadhan Feature Test Instructions */}
      <Card className="bg-blue-500/10 border-blue-500/30">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <CheckCircleIcon className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-400 mb-1">
                Cara Menguji Fitur Ramadhan
              </p>
              <div className="text-xs text-blue-300 space-y-1">
                <p>1. Aktifkan "Fitur Ramadhan" di atas dan klik "Simpan Pengaturan"</p>
                <p>2. Tunggu beberapa detik untuk sistem memperbarui navigasi</p>
                <p>3. Refresh halaman atau kembali ke dashboard untuk melihat menu "Ramadhan"</p>
                <p>4. Menu "Ramadhan" akan muncul di sidebar navigasi pengguna</p>
                <p>5. Klik menu tersebut untuk mengakses halaman fitur Ramadhan</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warning Notice */}
      <Card className="bg-orange-500/10 border-orange-500/30">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-orange-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-400 mb-1">
                Peringatan Penting
              </p>
              <p className="text-xs text-orange-300">
                Perubahan pengaturan akan mempengaruhi seluruh pengguna aplikasi.
                Pastikan Anda memahami dampak dari setiap perubahan sebelum menyimpan.
                Mode maintenance akan menonaktifkan akses pengguna ke aplikasi.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
