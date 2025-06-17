'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { updateDefaultIbadahType } from '@/lib/supabase/database';

const editIbadahSchema = z.object({
  name: z.string().min(1, 'Nama ibadah wajib diisi').max(100, 'Nama maksimal 100 karakter'),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
  unit: z.string().max(50, 'Satuan maksimal 50 karakter').optional(),
  scheduleType: z.enum(['always', 'date_range', 'specific_dates', 'ramadhan_auto']).default('always'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  specificDates: z.array(z.string()).optional(),
  isRamadhanOnly: z.boolean().default(false),
});

type EditIbadahFormData = z.infer<typeof editIbadahSchema>;

interface EditIbadahModalProps {
  ibadah: {
    id: string;
    name: string;
    description: string | null;
    tracking_type: 'checklist' | 'count';
    unit: string | null;
    schedule_type: 'always' | 'date_range' | 'specific_dates' | 'ramadhan_auto';
    start_date: string | null;
    end_date: string | null;
    specific_dates: string[] | null;
    is_ramadhan_only: boolean;
  };
  onClose: () => void;
  onSave: () => void;
}

export function EditIbadahModal({ ibadah, onClose, onSave }: EditIbadahModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditIbadahFormData>({
    resolver: zodResolver(editIbadahSchema),
    defaultValues: {
      name: ibadah.name,
      description: ibadah.description || '',
      unit: ibadah.unit || '',
      scheduleType: ibadah.schedule_type,
      startDate: ibadah.start_date || '',
      endDate: ibadah.end_date || '',
      specificDates: ibadah.specific_dates || [],
      isRamadhanOnly: ibadah.is_ramadhan_only,
    },
  });

  const scheduleType = watch('scheduleType');
  const isRamadhanOnly = watch('isRamadhanOnly');
  const trackingType = ibadah.tracking_type;

  const onSubmit = async (data: EditIbadahFormData) => {
    try {
      setLoading(true);
      setError(null);

      await updateDefaultIbadahType(ibadah.id, {
        name: data.name,
        description: data.description || null,
        unit: data.unit || null,
        schedule_type: data.isRamadhanOnly ? 'ramadhan_auto' : data.scheduleType,
        start_date: data.startDate || null,
        end_date: data.endDate || null,
        specific_dates: data.specificDates || null,
        is_ramadhan_only: data.isRamadhanOnly,
      });

      onSave();
    } catch (err: any) {
      console.error('Error updating ibadah:', err);
      setError(err.message || 'Gagal memperbarui ibadah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Edit Ibadah Default</h2>
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

          {/* Jenis Pelacakan (Read Only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jenis Pelacakan
            </label>
            <div className="p-3 bg-gray-50 rounded-md">
              <span className="text-gray-900 font-medium">
                {trackingType === 'checklist' ? 'Checklist' : 'Hitung'}
              </span>
              <p className="text-sm text-gray-500 mt-1">
                Jenis pelacakan tidak dapat diubah setelah ibadah dibuat
              </p>
            </div>
          </div>

          {/* Unit (untuk count) */}
          {trackingType === 'count' && (
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
                Satuan *
              </label>
              <Input
                {...register('unit')}
                id="unit"
                placeholder="ayat, halaman, kali, dll"
              />
              {errors.unit && (
                <p className="text-red-600 text-sm mt-1">{errors.unit.message}</p>
              )}
            </div>
          )}

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
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
