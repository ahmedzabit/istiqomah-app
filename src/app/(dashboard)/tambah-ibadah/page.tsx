'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ibadahTypeSchema, type IbadahTypeFormData } from '@/lib/validations/ibadah';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { ROUTES } from '@/lib/constants';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { createIbadahType, createUserIbadah } from '@/lib/supabase/database';

export default function TambahIbadahPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<IbadahTypeFormData>({
    resolver: zodResolver(ibadahTypeSchema),
    defaultValues: {
      trackingType: 'checklist',
      frequency: 'daily',
    },
  });

  const trackingType = watch('trackingType');

  // Get user on component mount
  useState(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  });

  const onSubmit = async (data: IbadahTypeFormData) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create ibadah type
      const ibadahType = await createIbadahType({
        name: data.name,
        description: data.description || null,
        tracking_type: data.trackingType,
        frequency: data.frequency,
        is_default: false,
        is_ramadhan_only: false,
        created_by: user.id
      });

      // Create user ibadah relationship
      await createUserIbadah({
        user_id: user.id,
        ibadah_type_id: ibadahType.id,
        target_count: data.targetCount || 1,
        is_active: true
      });

      setSuccess(true);
      reset();

      // Redirect after success
      setTimeout(() => {
        router.push(ROUTES.DASHBOARD);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
      console.error('Save ibadah error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Ibadah Berhasil Ditambahkan!</h1>
            <p className="text-gray-600 mt-2">
              Ibadah baru telah ditambahkan ke daftar tracking harian Anda.
            </p>
          </CardHeader>
          <CardContent>
            <Link href={ROUTES.DASHBOARD} className="w-full">
              <Button className="w-full">
                Kembali ke Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Link
          href={ROUTES.DASHBOARD}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Ibadah Baru</h1>
          <p className="text-gray-600">Buat tracking ibadah yang sesuai dengan kebutuhan Anda</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            {/* Nama Ibadah */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nama Ibadah *
              </label>
              <Input
                {...register('name')}
                id="name"
                placeholder="Contoh: Salat Dhuha, Membaca Yasin, dll"
              />
              {errors.name && (
                <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Deskripsi */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi (Opsional)
              </label>
              <textarea
                {...register('description')}
                id="description"
                rows={3}
                className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Deskripsi singkat tentang ibadah ini..."
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Jenis Pelacakan */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Jenis Pelacakan *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="relative">
                  <input
                    {...register('trackingType')}
                    type="radio"
                    value="checklist"
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    trackingType === 'checklist'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        trackingType === 'checklist'
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-gray-300'
                      }`}>
                        {trackingType === 'checklist' && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Checklist</div>
                        <div className="text-sm text-gray-500">Selesai atau belum</div>
                      </div>
                    </div>
                  </div>
                </label>

                <label className="relative">
                  <input
                    {...register('trackingType')}
                    type="radio"
                    value="count"
                    className="sr-only"
                  />
                  <div className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    trackingType === 'count'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        trackingType === 'count'
                          ? 'border-purple-500 bg-purple-500'
                          : 'border-gray-300'
                      }`}>
                        {trackingType === 'count' && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Hitung</div>
                        <div className="text-sm text-gray-500">Berdasarkan jumlah</div>
                      </div>
                    </div>
                  </div>
                </label>
              </div>
              {errors.trackingType && (
                <p className="text-red-600 text-sm mt-1">{errors.trackingType.message}</p>
              )}
            </div>

            {/* Target Count (hanya untuk count) */}
            {trackingType === 'count' && (
              <div>
                <label htmlFor="targetCount" className="block text-sm font-medium text-gray-700 mb-2">
                  Target Harian *
                </label>
                <Input
                  {...register('targetCount', { valueAsNumber: true })}
                  type="number"
                  id="targetCount"
                  min="1"
                  placeholder="Contoh: 5, 10, 100"
                />
                {errors.targetCount && (
                  <p className="text-red-600 text-sm mt-1">{errors.targetCount.message}</p>
                )}
              </div>
            )}

            {/* Frekuensi */}
            <div>
              <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-2">
                Frekuensi *
              </label>
              <select
                {...register('frequency')}
                id="frequency"
                className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                <option value="daily">Harian</option>
                <option value="weekly">Mingguan</option>
                <option value="monthly">Bulanan</option>
              </select>
              {errors.frequency && (
                <p className="text-red-600 text-sm mt-1">{errors.frequency.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4">
              <Link href={ROUTES.DASHBOARD} className="flex-1">
                <Button variant="outline" className="w-full">
                  Batal
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan Ibadah'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
