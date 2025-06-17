'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatDate, getGreeting, formatDateForDB } from '@/lib/utils';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { HabitCard } from '@/components/dashboard/HabitCard';
import { PlusIcon, FireIcon, TrophyIcon, CalendarIcon, CogIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import {
  getDashboardData,
  calculateTodayProgress,
  upsertIbadahRecord
} from '@/lib/supabase/database';

interface HabitData {
  id: string;
  name: string;
  description: string;
  tracking_type: 'checklist' | 'count';
  target_count: number;
  unit?: string;
  is_completed: boolean;
  count_value: number;
  color: string;
  ibadah_type_id: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [habits, setHabits] = useState<HabitData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [todayProgress, setTodayProgress] = useState(0);
  const [weeklyStreak, setWeeklyStreak] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const colors = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899', '#14B8A6', '#F97316'];

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setError('User not authenticated');
          setIsLoading(false);
          return;
        }

        setUser(user);

        // Get dashboard data from Supabase
        const dashboardData = await getDashboardData(user.id);

        // Validate dashboard data
        if (!dashboardData) {
          throw new Error('Dashboard data is null');
        }

        // Ensure userIbadah is an array
        const userIbadah = dashboardData.userIbadah || [];
        const todayRecords = dashboardData.todayRecords || [];

        // Transform data for UI
        const transformedHabits: HabitData[] = userIbadah.map((userIbadah, index) => {
          const todayRecord = todayRecords.find(
            record => record.ibadah_type_id === userIbadah.ibadah_type_id
          );

          const isCompleted = todayRecord ?
            (userIbadah.ibadah_types.tracking_type === 'checklist'
              ? todayRecord.is_completed
              : todayRecord.count_value >= userIbadah.target_count
            ) : false;

          return {
            id: userIbadah.id,
            ibadah_type_id: userIbadah.ibadah_type_id,
            name: userIbadah.ibadah_types.name,
            description: userIbadah.ibadah_types.description || '',
            tracking_type: userIbadah.ibadah_types.tracking_type,
            target_count: userIbadah.target_count,
            unit: userIbadah.unit || userIbadah.ibadah_types.unit,
            is_completed: isCompleted,
            count_value: todayRecord?.count_value || 0,
            color: colors[index % colors.length]
          };
        });

        setHabits(transformedHabits);

        // Calculate today's progress
        const progress = calculateTodayProgress(userIbadah, todayRecords);
        setTodayProgress(progress);

        // Calculate streak (simplified for now)
        setWeeklyStreak(5); // TODO: Implement real streak calculation

      } catch (err) {
        console.error('Error loading dashboard data:', {
          message: err?.message || 'Unknown error',
          code: err?.code,
          details: err?.details,
          hint: err?.hint,
          stack: err?.stack,
          name: err?.name,
          cause: err?.cause,
          error: err
        });
        setError(`Failed to load dashboard data: ${err?.message || 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [supabase.auth]);

  const handleHabitToggle = async (id: string, isCompleted: boolean, count?: number) => {
    if (!user) return;

    try {
      const habit = habits.find(h => h.id === id);
      if (!habit) return;

      const today = formatDateForDB(new Date());
      const countValue = count !== undefined ? count : (isCompleted ? 1 : 0);

      // Update in database
      await upsertIbadahRecord({
        user_id: user.id,
        ibadah_type_id: habit.ibadah_type_id,
        date: today,
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

      // Recalculate progress
      const updatedHabits = habits.map(h =>
        h.id === id
          ? {
              ...h,
              is_completed: isCompleted,
              count_value: countValue
            }
          : h
      );

      const completed = updatedHabits.filter(h => h.is_completed).length;
      const progress = (completed / updatedHabits.length) * 100;
      setTodayProgress(progress);

    } catch (err) {
      console.error('Error updating habit:', err);
      // TODO: Show error toast
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            {getGreeting()}, {user?.user_metadata?.full_name?.split(' ')[0] || 'Muslim'}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            {formatDate(new Date(), 'EEEE, dd MMMM yyyy')}
          </p>
        </div>
        
        <div className="mt-4 lg:mt-0 flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white rounded-lg px-4 py-2 shadow-sm">
            <FireIcon className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-700">
              {weeklyStreak} hari berturut-turut
            </span>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Progress */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Progress Hari Ini</h2>
              <p className="text-sm text-gray-500">
                {habits.filter(h => h.is_completed).length} dari {habits.length} ibadah selesai
              </p>
            </div>
            <ProgressRing
              progress={todayProgress}
              size={80}
              strokeWidth={6}
              color="#8B5CF6"
            >
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">
                  {Math.round(todayProgress)}%
                </div>
              </div>
            </ProgressRing>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-purple-50 rounded-xl">
              <TrophyIcon className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-purple-900">
                {habits.filter(h => h.is_completed).length}
              </div>
              <div className="text-xs text-purple-600">Selesai</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-xl">
              <CalendarIcon className="w-6 h-6 text-orange-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-orange-900">
                {habits.length - habits.filter(h => h.is_completed).length}
              </div>
              <div className="text-xs text-orange-600">Tersisa</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <FireIcon className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-lg font-bold text-green-900">{weeklyStreak}</div>
              <div className="text-xs text-green-600">Streak</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h3>
          <div className="space-y-3">
            <Link
              href={ROUTES.TAMBAH_IBADAH}
              className="flex items-center space-x-3 p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
            >
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <PlusIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Tambah Ibadah</div>
                <div className="text-xs text-gray-500">Buat tracking baru</div>
              </div>
            </Link>

            <Link
              href={ROUTES.KELOLA_IBADAH}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                <CogIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Kelola Ibadah</div>
                <div className="text-xs text-gray-500">Edit & hapus ibadah</div>
              </div>
            </Link>
            
            <Link
              href={ROUTES.RECORD_IBADAH}
              className="flex items-center space-x-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Record Ibadah</div>
                <div className="text-xs text-gray-500">Catat untuk tanggal lain</div>
              </div>
            </Link>

            <Link
              href={ROUTES.MUHASABAH}
              className="flex items-center space-x-3 p-3 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
            >
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                <FireIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Muhasabah</div>
                <div className="text-xs text-gray-500">Refleksi harian</div>
              </div>
            </Link>

            <Link
              href={ROUTES.LAPORAN}
              className="flex items-center space-x-3 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
            >
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <TrophyIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Lihat Laporan</div>
                <div className="text-xs text-gray-500">Progress & statistik</div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Habits List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Ibadah Hari Ini</h2>
          <Link
            href={ROUTES.TAMBAH_IBADAH}
            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            Tambah Ibadah
          </Link>
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
              unit={habit.unit}
              color={habit.color}
              onToggle={handleHabitToggle}
            />
          ))}
        </div>
      </div>

      {/* Floating Action Button */}
      <Link href={ROUTES.TAMBAH_IBADAH} className="floating-button">
        <PlusIcon className="w-6 h-6" />
      </Link>
    </div>
  );
}
