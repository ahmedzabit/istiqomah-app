'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDateForDB } from '@/lib/utils';
import { HabitCard } from '@/components/dashboard/HabitCard';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArrowLeftIcon, CalendarIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import {
  getDashboardData,
  getIbadahRecords,
  upsertIbadahRecord
} from '@/lib/supabase/database';

interface HabitData {
  id: string;
  ibadah_type_id: string;
  name: string;
  description: string;
  tracking_type: 'checklist' | 'count';
  target_count: number;
  is_completed: boolean;
  count_value: number;
  color: string;
}

export default function RecordIbadahPage() {
  const [habits, setHabits] = useState<HabitData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(formatDateForDB(new Date()));
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClient();

  const colors = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5A2B'];

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      loadHabitsForDate();
    }
  }, [user, selectedDate]);

  const loadHabitsForDate = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get user's active ibadah
      const dashboardData = await getDashboardData(user.id);
      
      // Get records for selected date
      const dateRecords = await getIbadahRecords(user.id, selectedDate);

      // Transform data for UI
      const transformedHabits: HabitData[] = dashboardData.userIbadah.map((userIbadah, index) => {
        const dateRecord = dateRecords.find(
          record => record.ibadah_type_id === userIbadah.ibadah_type_id
        );

        const isCompleted = dateRecord ?
          (userIbadah.ibadah_types.tracking_type === 'checklist'
            ? dateRecord.is_completed
            : dateRecord.count_value >= userIbadah.target_count
          ) : false;

        return {
          id: userIbadah.id,
          ibadah_type_id: userIbadah.ibadah_type_id,
          name: userIbadah.ibadah_types.name,
          description: userIbadah.ibadah_types.description || '',
          tracking_type: userIbadah.ibadah_types.tracking_type,
          target_count: userIbadah.target_count,
          is_completed: isCompleted,
          count_value: dateRecord?.count_value || 0,
          color: colors[index % colors.length]
        };
      });

      setHabits(transformedHabits);
    } catch (err: any) {
      console.error('Error loading habits:', err);
      setError('Gagal memuat data ibadah');
    } finally {
      setIsLoading(false);
    }
  };

  const handleHabitToggle = async (id: string, isCompleted: boolean, count?: number, date?: string) => {
    if (!user) return;

    try {
      const habit = habits.find(h => h.id === id);
      if (!habit) return;

      const recordDate = date || selectedDate;
      const countValue = count !== undefined ? count : (isCompleted ? 1 : 0);

      // Update in database
      await upsertIbadahRecord({
        user_id: user.id,
        ibadah_type_id: habit.ibadah_type_id,
        date: recordDate,
        is_completed: isCompleted,
        count_value: countValue
      });

      // Update local state
      setHabits(prev => prev.map(h =>
        h.id === id
          ? {
              ...h,
              is_completed: isCompleted,
              count_value: countValue
            }
          : h
      ));

      setSuccess(`${habit.name} berhasil diperbarui!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error updating habit:', err);
      setError('Gagal memperbarui data ibadah');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Link
          href={ROUTES.DASHBOARD}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Record Ibadah</h1>
          <p className="text-gray-600">Catat ibadah untuk tanggal tertentu</p>
        </div>
      </div>

      {/* Date Selector */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <CalendarIcon className="w-5 h-5 text-gray-500" />
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
            <div className="text-sm text-gray-500">
              {new Date(selectedDate).toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            * Anda hanya dapat memilih tanggal hari ini atau sebelumnya
          </div>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Memuat data ibadah...</p>
        </div>
      ) : habits.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Belum ada ibadah yang ditambahkan
              </h3>
              <p className="text-gray-500 mb-6">
                Tambahkan ibadah terlebih dahulu untuk mulai tracking
              </p>
              <Link
                href={ROUTES.TAMBAH_IBADAH}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Tambah Ibadah
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Ibadah untuk {new Date(selectedDate).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </h2>
            <div className="text-sm text-gray-500">
              {habits.filter(h => h.is_completed).length} dari {habits.length} selesai
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                id={habit.id}
                name={habit.name}
                description={habit.description}
                isCompleted={habit.is_completed}
                trackingType={habit.tracking_type}
                currentCount={habit.count_value}
                targetCount={habit.target_count}
                color={habit.color}
                date={selectedDate}
                showDateInput={false}
                onToggle={handleHabitToggle}
              />
            ))}
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">💡 Tips:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Pilih tanggal di atas untuk mencatat ibadah pada hari tertentu</li>
              <li>• Data akan tersimpan otomatis setelah Anda mengklik checklist atau mengubah jumlah</li>
              <li>• Anda bisa mengubah record ibadah kapan saja</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
