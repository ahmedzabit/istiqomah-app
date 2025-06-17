'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { updateUserIbadah, updateIbadahType } from '@/lib/supabase/database';

const editIbadahSchema = z.object({
  name: z.string().min(1, 'Nama ibadah wajib diisi').max(100, 'Nama maksimal 100 karakter'),
  description: z.string().max(500, 'Deskripsi maksimal 500 karakter').optional(),
  targetCount: z.number().min(1, 'Target minimal 1').max(1000, 'Target maksimal 1000').optional(),
  unit: z.string().max(50, 'Satuan maksimal 50 karakter').optional(),
  scheduleType: z.enum(['always', 'date_range', 'specific_dates']).default('always'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  specificDates: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
});

type EditIbadahFormData = z.infer<typeof editIbadahSchema>;

interface EditIbadahModalProps {
  ibadah: {
    id: string;
    target_count: number;
    unit: string | null;
    is_active: boolean;
    ibadah_types: {
      id: string;
      name: string;
      description: string | null;
      tracking_type: 'checklist' | 'count';
      unit: string | null;
      schedule_type: 'always' | 'date_range' | 'specific_dates' | 'ramadhan_auto';
      start_date: string | null;
      end_date: string | null;
      specific_dates: string[] | null;
      is_default: boolean;
      created_by: string | null;
    };
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
      name: ibadah.ibadah_types.name,
      description: ibadah.ibadah_types.description || '',
      targetCount: ibadah.target_count,
      unit: ibadah.unit || ibadah.ibadah_types.unit || '',
      scheduleType: ibadah.ibadah_types.schedule_type === 'ramadhan_auto' ? 'always' : ibadah.ibadah_types.schedule_type,
      startDate: ibadah.ibadah_types.start_date || '',
      endDate: ibadah.ibadah_types.end_date || '',
      specificDates: ibadah.ibadah_types.specific_dates || [],
      isActive: ibadah.is_active,
    },
  });

  const scheduleType = watch('scheduleType');
  const trackingType = ibadah.ibadah_types.tracking_type;

  const onSubmit = async (data: EditIbadahFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Update user_ibadah
      await updateUserIbadah(ibadah.id, {
        target_count: data.targetCount || 1,
        unit: data.unit || null,
        is_active: data.isActive,
      });

      // Update ibadah_types (only if it's not a default type or user is the creator)
      if (!ibadah.ibadah_types.is_default) {
        await updateIbadahType(ibadah.ibadah_types.id, {
          name: data.name,
          description: data.description || null,
          unit: data.unit || null,
          schedule_type: data.scheduleType,
          start_date: data.startDate || null,
          end_date: data.endDate || null,
          specific_dates: data.specificDates || null,
        });
      }

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
          <h2 className="text-xl font-semibold text-gray-900">Edit Ibadah</h2>
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
              disabled={ibadah.ibadah_types.is_default}
              placeholder="Contoh: Salat Subuh, Tilawah Al-Quran"
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
            {ibadah.ibadah_types.is_default && (
              <p className="text-gray-500 text-sm mt-1">Nama ibadah default tidak dapat diubah</p>
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
              disabled={ibadah.ibadah_types.is_default}
              rows={3}
              className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Deskripsi singkat tentang ibadah ini..."
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Target Count & Unit (untuk count tracking) */}
          {trackingType === 'count' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="targetCount" className="block text-sm font-medium text-gray-700 mb-2">
                  Target *
                </label>
                <Input
                  {...register('targetCount', { valueAsNumber: true })}
                  type="number"
                  id="targetCount"
                  min="1"
                  placeholder="5"
                />
                {errors.targetCount && (
                  <p className="text-red-600 text-sm mt-1">{errors.targetCount.message}</p>
                )}
              </div>

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
            </div>
          )}

          {/* Status Aktif */}
          <div>
            <label className="flex items-center space-x-3">
              <input
                {...register('isActive')}
                type="checkbox"
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-600 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Aktifkan ibadah ini</span>
            </label>
            <p className="text-gray-500 text-sm mt-1">
              Ibadah yang tidak aktif tidak akan muncul di dashboard
            </p>
          </div>

          {/* Jadwal (hanya untuk custom ibadah) */}
          {!ibadah.ibadah_types.is_default && (
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
                    className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-600 border-gray-300"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Selalu Aktif</div>
                    <div className="text-sm text-gray-500">Ibadah ini akan selalu muncul</div>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    {...register('scheduleType')}
                    type="radio"
                    value="date_range"
                    className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-600 border-gray-300"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Rentang Tanggal</div>
                    <div className="text-sm text-gray-500">Aktif dalam periode tertentu</div>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    {...register('scheduleType')}
                    type="radio"
                    value="specific_dates"
                    className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-600 border-gray-300"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Tanggal Tertentu</div>
                    <div className="text-sm text-gray-500">Hanya pada tanggal yang dipilih</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Date Range Fields */}
          {scheduleType === 'date_range' && !ibadah.ibadah_types.is_default && (
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
          {scheduleType === 'specific_dates' && !ibadah.ibadah_types.is_default && (
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
                    className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-100 text-emerald-800"
                  >
                    {new Date(date).toLocaleDateString('id-ID')}
                    <button
                      type="button"
                      onClick={() => {
                        const currentDates = watch('specificDates') || [];
                        setValue('specificDates', currentDates.filter((_, i) => i !== index));
                      }}
                      className="ml-1 text-emerald-600 hover:text-emerald-800"
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
