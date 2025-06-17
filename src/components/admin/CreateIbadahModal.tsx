'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { createDefaultIbadahType } from '@/lib/supabase/database';

const createIbadahSchema = z.object({
  name: z.string().min(1, 'Nama ibadah wajib diisi').max(100, 'Nama maksimal 100 karakter'),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
  trackingType: z.enum(['checklist', 'count']),
  frequency: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  unit: z.string().max(50, 'Satuan maksimal 50 karakter').optional(),
  scheduleType: z.enum(['always', 'date_range', 'specific_dates', 'ramadhan_auto']).default('always'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  specificDates: z.array(z.string()).optional(),
  isRamadhanOnly: z.boolean().default(false),
}).refine((data) => {
  if (data.trackingType === 'count' && !data.unit) {
    return false;
  }
  return true;
}, {
  message: 'Satuan wajib diisi untuk jenis pelacakan hitung',
  path: ['unit'],
}).refine((data) => {
  if (data.scheduleType === 'date_range' && (!data.startDate || !data.endDate)) {
    return false;
  }
  return true;
}, {
  message: 'Tanggal mulai dan akhir wajib diisi untuk jadwal rentang tanggal',
  path: ['startDate'],
}).refine((data) => {
  if (data.scheduleType === 'specific_dates' && (!data.specificDates || data.specificDates.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'Tanggal spesifik wajib diisi untuk jadwal tanggal tertentu',
  path: ['specificDates'],
});

type CreateIbadahFormData = z.infer<typeof createIbadahSchema>;

interface CreateIbadahModalProps {
  onClose: () => void;
  onSave: () => void;
}

export function CreateIbadahModal({ onClose, onSave }: CreateIbadahModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateIbadahFormData>({
    resolver: zodResolver(createIbadahSchema),
    defaultValues: {
      trackingType: 'checklist',
      frequency: 'daily',
      scheduleType: 'always',
      isRamadhanOnly: false,
    },
  });

  const trackingType = watch('trackingType');
  const scheduleType = watch('scheduleType');
  const isRamadhanOnly = watch('isRamadhanOnly');

  const onSubmit = async (data: CreateIbadahFormData) => {
    try {
      setLoading(true);
      setError(null);

      await createDefaultIbadahType({
        name: data.name,
        description: data.description || null,
        tracking_type: data.trackingType,
        frequency: data.frequency,
        unit: data.unit || null,
        schedule_type: isRamadhanOnly ? 'ramadhan_auto' : data.scheduleType,
        start_date: data.startDate || null,
        end_date: data.endDate || null,
        specific_dates: data.specificDates || null,
        is_ramadhan_only: isRamadhanOnly,
      });

      onSave();
    } catch (err: any) {
      console.error('Error creating ibadah:', err);
      setError(err.message || 'Gagal membuat ibadah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Tambah Ibadah Default</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-600 text-sm">{error}</p>
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
              placeholder="Contoh: Salat Subuh, Tilawah Al-Quran"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Deskripsi */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={3}
              className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
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
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  {...register('trackingType')}
                  type="radio"
                  value="checklist"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300"
                />
                <div>
                  <div className="font-medium text-gray-900">Checklist</div>
                  <div className="text-sm text-gray-500">Selesai atau belum</div>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  {...register('trackingType')}
                  type="radio"
                  value="count"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300"
                />
                <div>
                  <div className="font-medium text-gray-900">Hitung</div>
                  <div className="text-sm text-gray-500">Berdasarkan jumlah</div>
                </div>
              </label>
            </div>
            {errors.trackingType && (
              <p className="text-red-600 text-sm mt-1">{errors.trackingType.message}</p>
            )}
          </div>

          {/* Unit (untuk count) */}
          {trackingType === 'count' && (
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
                Satuan *
              </label>
              <div className="flex space-x-2">
                <select
                  {...register('unit')}
                  className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setValue('unit', '');
                    } else {
                      setValue('unit', e.target.value);
                    }
                  }}
                >
                  <option value="">Pilih satuan...</option>
                  <option value="ayat">Ayat</option>
                  <option value="halaman">Halaman</option>
                  <option value="lembar">Lembar</option>
                  <option value="kali">Kali</option>
                  <option value="menit">Menit</option>
                  <option value="rupiah">Rupiah</option>
                  <option value="custom">Lainnya (tulis manual)</option>
                </select>
              </div>
              <Input
                {...register('unit')}
                id="unit"
                placeholder="Atau tulis satuan sendiri..."
                className="mt-2"
              />
              {errors.unit && (
                <p className="text-red-600 text-sm mt-1">{errors.unit.message}</p>
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
              className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
            </select>
            {errors.frequency && (
              <p className="text-red-600 text-sm mt-1">{errors.frequency.message}</p>
            )}
          </div>

          {/* Khusus Ramadhan */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                {...register('isRamadhanOnly')}
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Khusus Ramadhan</span>
            </label>
            <p className="text-gray-500 text-sm mt-1">
              Ibadah ini hanya akan muncul selama bulan Ramadhan (diatur otomatis oleh admin)
            </p>
          </div>

          {/* Jadwal (jika bukan Ramadhan) */}
          {!isRamadhanOnly && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Jadwal Ibadah *
              </label>
              <div className="space-y-3">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    {...register('scheduleType')}
                    type="radio"
                    value="always"
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Selalu Aktif</div>
                    <div className="text-sm text-gray-500">Ibadah ini akan selalu muncul setiap hari</div>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    {...register('scheduleType')}
                    type="radio"
                    value="date_range"
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Rentang Tanggal</div>
                    <div className="text-sm text-gray-500">Ibadah ini aktif dalam periode tertentu</div>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    {...register('scheduleType')}
                    type="radio"
                    value="specific_dates"
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Tanggal Tertentu</div>
                    <div className="text-sm text-gray-500">Ibadah ini hanya muncul pada tanggal yang dipilih</div>
                  </div>
                </label>
              </div>
              {errors.scheduleType && (
                <p className="text-red-600 text-sm mt-1">{errors.scheduleType.message}</p>
              )}
            </div>
          )}

          {/* Date Range Fields */}
          {scheduleType === 'date_range' && !isRamadhanOnly && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Mulai *
                </label>
                <Input
                  {...register('startDate')}
                  type="date"
                  id="startDate"
                />
                {errors.startDate && (
                  <p className="text-red-600 text-sm mt-1">{errors.startDate.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Akhir *
                </label>
                <Input
                  {...register('endDate')}
                  type="date"
                  id="endDate"
                />
                {errors.endDate && (
                  <p className="text-red-600 text-sm mt-1">{errors.endDate.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Specific Dates */}
          {scheduleType === 'specific_dates' && !isRamadhanOnly && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tanggal Spesifik *
              </label>
              <div className="text-sm text-gray-500 mb-3">
                Pilih tanggal-tanggal kapan ibadah ini akan muncul. Anda bisa memilih beberapa tanggal.
              </div>
              <Input
                type="date"
                onChange={(e) => {
                  const currentDates = watch('specificDates') || [];
                  const newDate = e.target.value;
                  if (newDate && !currentDates.includes(newDate)) {
                    setValue('specificDates', [...currentDates, newDate]);
                  }
                }}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {(watch('specificDates') || []).map((date, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {new Date(date).toLocaleDateString('id-ID')}
                    <button
                      type="button"
                      onClick={() => {
                        const currentDates = watch('specificDates') || [];
                        setValue('specificDates', currentDates.filter((_, i) => i !== index));
                      }}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              {errors.specificDates && (
                <p className="text-red-600 text-sm mt-1">{errors.specificDates.message}</p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : 'Simpan Ibadah'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
