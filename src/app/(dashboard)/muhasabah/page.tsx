'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { muhasabahEntrySchema, type MuhasabahEntryFormData } from '@/lib/validations/ibadah';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/client';
import { getMuhasabahEntry, upsertMuhasabahEntry } from '@/lib/supabase/database';
import { formatDateForDB } from '@/lib/utils';
import { 
  HeartIcon, 
  FaceSmileIcon, 
  FaceFrownIcon,
  BookOpenIcon,
  ArrowLeftIcon 
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';

const moodOptions = [
  { value: 'very_happy', icon: '😊' },
  { value: 'happy', icon: '🙂' },
  { value: 'neutral', icon: '😐' },
  { value: 'sad', icon: '😔' },
  { value: 'very_sad', icon: '😢' },
];

export default function MuhasabahPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(formatDateForDB(new Date()));
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<MuhasabahEntryFormData>({
    resolver: zodResolver(muhasabahEntrySchema),
    defaultValues: {
      date: selectedDate,
    },
  });

  const selectedMood = watch('mood');

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);


    };
    getUser();
  }, []);

  useEffect(() => {
    if (user && selectedDate) {
      loadMuhasabahEntry();
    }
  }, [user, selectedDate]);

  const loadMuhasabahEntry = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const entry = await getMuhasabahEntry(user.id, selectedDate);
      if (entry) {
        setValue('goodThings', entry.good_things);
        setValue('improvements', entry.improvements);
        setValue('prayersHopes', entry.prayers_hopes);
        setValue('mood', entry.mood as any);
      } else {
        reset({
          date: selectedDate,
          goodThings: '',
          improvements: '',
          prayersHopes: '',
          mood: undefined,
        });
      }
    } catch (err: any) {
      console.error('Error loading muhasabah entry:', err);
      setError('Gagal memuat data muhasabah');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: MuhasabahEntryFormData) => {
    if (!user) return;

    setIsSaving(true);
    setError(null);

    try {
      await upsertMuhasabahEntry({
        user_id: user.id,
        date: selectedDate,
        good_things: data.goodThings,
        improvements: data.improvements,
        prayers_hopes: data.prayersHopes,
        mood: data.mood || null,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Save muhasabah error:', {
        message: err?.message || 'Unknown error',
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        error: err
      });

      let errorMessage = 'Terjadi kesalahan. Silakan coba lagi.';

      if (err.name === 'MuhasabahSaveError') {
        errorMessage = err.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.code === '42P01') {
        errorMessage = 'Tabel muhasabah belum dibuat. Silakan jalankan script database terlebih dahulu.';
      } else if (err.code === '23505') {
        errorMessage = 'Data untuk tanggal ini sudah ada. Sedang memperbarui...';
      }

      // If the error suggests table doesn't exist, also suggest checking database setup
      if (errorMessage.includes('does not exist') || errorMessage.includes('relation') || err.code === '42P01') {
        errorMessage += ' Pastikan Anda telah menjalankan script database migration.';
      }

      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
    setValue('date', newDate);
  };



  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Link
          href={ROUTES.DASHBOARD}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Muhasabah Harian</h1>
          <p className="text-gray-600">Refleksi dan evaluasi diri setiap hari</p>
        </div>
        <Link
          href="/muhasabah/jurnal"
          className="flex items-center space-x-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
        >
          <BookOpenIcon className="w-4 h-4" />
          <span>Lihat Jurnal</span>
        </Link>
      </div>



      {/* Date Selector */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">
              Pilih Tanggal:
            </label>
            <Input
              type="date"
              value={selectedDate}
              max={formatDateForDB(new Date())}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-auto"
            />
          </div>
          <div className="mt-2 text-xs text-gray-500">
            * Anda hanya dapat memilih tanggal hari ini atau sebelumnya
          </div>
        </CardContent>
      </Card>

      {/* Muhasabah Form */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            Muhasabah - {new Date(selectedDate).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h2>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Memuat data...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p>{error}</p>
                      {(error.includes('tabel') || error.includes('table') || error.includes('database')) && (
                        <div className="mt-2">
                          <Link
                            href={ROUTES.DATABASE_CHECK}
                            className="inline-flex items-center text-sm text-red-800 hover:text-red-900 underline"
                          >
                            🔧 Periksa Setup Database
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                  Muhasabah berhasil disimpan! 🤲
                </div>
              )}

              {/* Good Things */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <HeartIcon className="w-4 h-4 inline mr-2 text-green-500" />
                  Apa yang sudah baik hari ini? *
                </label>
                <textarea
                  {...register('goodThings')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Tuliskan hal-hal baik yang sudah Anda lakukan hari ini..."
                />
                {errors.goodThings && (
                  <p className="text-red-600 text-sm mt-1">{errors.goodThings.message}</p>
                )}
              </div>

              {/* Improvements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaceSmileIcon className="w-4 h-4 inline mr-2 text-blue-500" />
                  Apa yang bisa ditingkatkan? *
                </label>
                <textarea
                  {...register('improvements')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Tuliskan hal-hal yang bisa Anda perbaiki atau tingkatkan..."
                />
                {errors.improvements && (
                  <p className="text-red-600 text-sm mt-1">{errors.improvements.message}</p>
                )}
              </div>

              {/* Prayers and Hopes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🤲 Doa atau harapan untuk esok hari *
                </label>
                <textarea
                  {...register('prayersHopes')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Tuliskan doa atau harapan Anda untuk hari esok..."
                />
                {errors.prayersHopes && (
                  <p className="text-red-600 text-sm mt-1">{errors.prayersHopes.message}</p>
                )}
              </div>

              {/* Mood Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Bagaimana perasaan Anda hari ini?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {moodOptions.map((mood) => (
                    <label
                      key={mood.value}
                      className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
                        selectedMood === mood.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        {...register('mood')}
                        type="radio"
                        value={mood.value}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <div className="text-2xl">{mood.icon}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan Muhasabah'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
