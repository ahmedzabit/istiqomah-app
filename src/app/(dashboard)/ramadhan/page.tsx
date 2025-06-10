'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { getRamadhanInfo, formatIslamicGreeting, getPrayerTimeGreeting } from '@/lib/utils';
import { getRamadhanIbadahForUser, initializeRamadhanIbadah, upsertIbadahRecord } from '@/lib/supabase/database';
import {
  BookOpenIcon,
  CalendarIcon,
  StarIcon,
  HeartIcon,
  SparklesIcon,
  SunIcon,
  MoonIcon,
  ClockIcon,
  CheckIcon
} from '@heroicons/react/24/outline';

interface RamadhanContent {
  id: string;
  date: string;
  ayat?: string;
  hadis?: string;
  tips?: string;
  doa?: string;
  created_at: string;
  updated_at: string;
}

interface RamadhanProgress {
  currentDay: number;
  totalDays: number;
  completedIbadah: number;
  totalIbadah: number;
  streakDays: number;
}

interface RamadhanIbadah {
  id: string;
  target_count: number;
  ibadah_type: {
    id: string;
    name: string;
    description: string;
    tracking_type: 'checklist' | 'count';
    is_ramadhan_only: boolean;
  };
  record: any;
  is_completed: boolean;
  count_value: number;
}

export default function RamadhanPage() {
  const [todayContent, setTodayContent] = useState<RamadhanContent | null>(null);
  const [ramadhanIbadah, setRamadhanIbadah] = useState<RamadhanIbadah[]>([]);
  const [progress, setProgress] = useState<RamadhanProgress>({
    currentDay: 1,
    totalDays: 30,
    completedIbadah: 0,
    totalIbadah: 0,
    streakDays: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'today' | 'progress' | 'calendar'>('today');
  const [user, setUser] = useState<any>(null);

  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchTodayContent();
      fetchRamadhanProgress();
      fetchRamadhanIbadah();
    }
  }, [user]);

  useEffect(() => {
    // Update progress when ramadhanIbadah changes
    if (ramadhanIbadah.length > 0) {
      fetchRamadhanProgress();
    }
  }, [ramadhanIbadah]);

  const fetchTodayContent = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('ramadhan_content')
        .select('*')
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setTodayContent(data || null);
    } catch (error) {
      console.error('Error fetching today content:', error);
    }
  };

  const fetchRamadhanIbadah = async () => {
    try {
      if (!user) return;

      // Try to get existing Ramadhan ibadah
      let ibadahData = await getRamadhanIbadahForUser(user.id);

      // If no Ramadhan ibadah found, initialize them
      if (ibadahData.length === 0) {
        await initializeRamadhanIbadah(user.id);
        ibadahData = await getRamadhanIbadahForUser(user.id);
      }

      setRamadhanIbadah(ibadahData);
    } catch (error) {
      console.error('Error fetching Ramadhan ibadah:', error);
    }
  };

  const fetchRamadhanProgress = async () => {
    try {
      if (!user) return;

      // Get Ramadhan info using utility function
      const ramadhanInfo = getRamadhanInfo();

      // Count completed ibadah from ramadhanIbadah state
      const completedCount = ramadhanIbadah.filter(ibadah => ibadah.is_completed).length;

      setProgress({
        currentDay: ramadhanInfo.currentDay,
        totalDays: ramadhanInfo.totalDays,
        completedIbadah: completedCount,
        totalIbadah: ramadhanIbadah.length,
        streakDays: 0 // TODO: Calculate streak
      });
    } catch (error) {
      console.error('Error fetching Ramadhan progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIbadahToggle = async (ibadahId: string, isCompleted: boolean, count?: number) => {
    try {
      if (!user) return;

      const ibadah = ramadhanIbadah.find(i => i.id === ibadahId);
      if (!ibadah) return;

      const today = new Date().toISOString().split('T')[0];
      const countValue = count !== undefined ? count : (isCompleted ? 1 : 0);

      // Update in database
      await upsertIbadahRecord({
        user_id: user.id,
        ibadah_type_id: ibadah.ibadah_type.id,
        date: today,
        is_completed: isCompleted,
        count_value: countValue
      });

      // Update local state
      setRamadhanIbadah(prev => prev.map(i =>
        i.id === ibadahId
          ? {
              ...i,
              is_completed: isCompleted,
              count_value: countValue
            }
          : i
      ));
    } catch (error) {
      console.error('Error updating Ramadhan ibadah:', error);
    }
  };

  const getRamadhanGreeting = () => {
    const prayerGreeting = getPrayerTimeGreeting();
    const islamicGreeting = formatIslamicGreeting();

    // Prioritize prayer time greetings during Ramadhan
    if (prayerGreeting.includes('Waktu')) {
      return prayerGreeting;
    }
    return islamicGreeting;
  };

  const getProgressPercentage = () => {
    if (progress.totalIbadah === 0) return 0;
    return Math.round((progress.completedIbadah / progress.totalIbadah) * 100);
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
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <MoonIcon className="w-8 h-8 text-purple-400" />
          <h1 className="text-3xl font-bold text-white">Ramadhan Mubarak</h1>
          <StarIcon className="w-8 h-8 text-yellow-400" />
        </div>
        <p className="text-slate-400">
          {getRamadhanGreeting()}, semoga ibadah hari ini berkah dan diterima Allah SWT
        </p>
      </div>

      {/* Progress Overview */}
      <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/30">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CalendarIcon className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-slate-400">Hari ke-</p>
              <p className="text-2xl font-bold text-white">{progress.currentDay}</p>
              <p className="text-xs text-slate-500">dari {progress.totalDays} hari</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-slate-400">Progress Hari Ini</p>
              <p className="text-2xl font-bold text-white">{getProgressPercentage()}%</p>
              <p className="text-xs text-slate-500">{progress.completedIbadah}/{progress.totalIbadah} ibadah</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <HeartIcon className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-slate-400">Streak</p>
              <p className="text-2xl font-bold text-white">{progress.streakDays}</p>
              <p className="text-xs text-slate-500">hari berturut</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <ClockIcon className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-slate-400">Sisa Hari</p>
              <p className="text-2xl font-bold text-white">{progress.totalDays - progress.currentDay + 1}</p>
              <p className="text-xs text-slate-500">hari lagi</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg">
        {[
          { id: 'today', label: 'Hari Ini', icon: SunIcon },
          { id: 'progress', label: 'Progress', icon: StarIcon },
          { id: 'calendar', label: 'Kalender', icon: CalendarIcon }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
              selectedTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-sm font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {selectedTab === 'today' && (
        <div className="space-y-6">
          {/* Ramadhan Ibadah Tracking */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <SparklesIcon className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg font-semibold text-white">Ibadah Ramadhan Hari Ini</h2>
                </div>
                <div className="text-sm text-slate-400">
                  {progress.completedIbadah}/{progress.totalIbadah} selesai
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {ramadhanIbadah.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-slate-400 mb-4">
                    Memuat ibadah Ramadhan...
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ramadhanIbadah.map((ibadah) => (
                    <div key={ibadah.id} className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-white">{ibadah.ibadah_type.name}</h3>
                        {ibadah.ibadah_type.tracking_type === 'checklist' ? (
                          <button
                            onClick={() => handleIbadahToggle(ibadah.id, !ibadah.is_completed)}
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                              ibadah.is_completed
                                ? 'bg-green-500'
                                : 'bg-slate-600 border-2 border-slate-500 hover:border-green-400'
                            }`}
                          >
                            {ibadah.is_completed && (
                              <CheckIcon className="w-4 h-4 text-white" />
                            )}
                          </button>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleIbadahToggle(ibadah.id, ibadah.count_value > 0, Math.max(0, ibadah.count_value - 1))}
                              className="w-6 h-6 bg-slate-600 rounded-full flex items-center justify-center text-white hover:bg-slate-500"
                            >
                              -
                            </button>
                            <span className="text-white font-medium min-w-[2rem] text-center">
                              {ibadah.count_value}/{ibadah.target_count}
                            </span>
                            <button
                              onClick={() => handleIbadahToggle(ibadah.id, ibadah.count_value + 1 >= ibadah.target_count, ibadah.count_value + 1)}
                              className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-500"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">{ibadah.ibadah_type.description}</p>
                      {ibadah.ibadah_type.tracking_type === 'count' && (
                        <div className="mt-2">
                          <div className="w-full bg-slate-600 rounded-full h-1">
                            <div
                              className="bg-purple-500 h-1 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min((ibadah.count_value / ibadah.target_count) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {todayContent ? (
            <>
              {/* Ayat of the Day */}
              {todayContent.ayat && (
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <BookOpenIcon className="w-5 h-5 text-green-400" />
                      <h2 className="text-lg font-semibold text-white">Ayat Hari Ini</h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <p className="text-green-100 text-lg leading-relaxed text-center font-arabic">
                        {todayContent.ayat}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Hadis of the Day */}
              {todayContent.hadis && (
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <SparklesIcon className="w-5 h-5 text-blue-400" />
                      <h2 className="text-lg font-semibold text-white">Hadis Hari Ini</h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                      <p className="text-blue-100 leading-relaxed">
                        {todayContent.hadis}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tips of the Day */}
              {todayContent.tips && (
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <HeartIcon className="w-5 h-5 text-purple-400" />
                      <h2 className="text-lg font-semibold text-white">Tips Ramadhan</h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                      <p className="text-purple-100 leading-relaxed">
                        {todayContent.tips}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Doa of the Day */}
              {todayContent.doa && (
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="flex items-center space-x-2">
                      <StarIcon className="w-5 h-5 text-yellow-400" />
                      <h2 className="text-lg font-semibold text-white">Doa Hari Ini</h2>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                      <p className="text-yellow-100 leading-relaxed text-center">
                        {todayContent.doa}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-8 text-center">
                <BookOpenIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Belum Ada Konten Hari Ini</h3>
                <p className="text-slate-400">
                  Konten Ramadhan untuk hari ini belum tersedia. Silakan cek kembali nanti.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {selectedTab === 'progress' && (
        <div className="space-y-6">
          {/* Daily Progress */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <h2 className="text-lg font-semibold text-white">Progress Ramadhan</h2>
              <p className="text-sm text-slate-400">
                Tracking ibadah khusus Ramadhan Anda
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Progress Keseluruhan</span>
                  <span className="text-white font-medium">
                    {Math.round((progress.currentDay / progress.totalDays) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(progress.currentDay / progress.totalDays) * 100}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-green-400">{progress.completedIbadah}</p>
                    <p className="text-sm text-slate-400">Ibadah Hari Ini</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-400">{progress.streakDays}</p>
                    <p className="text-sm text-slate-400">Hari Berturut</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Motivational Message */}
          <Card className="bg-gradient-to-r from-green-900/50 to-blue-900/50 border-green-500/30">
            <CardContent className="p-6 text-center">
              <SparklesIcon className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Tetap Semangat!
              </h3>
              <p className="text-green-100">
                Anda sudah menjalani {progress.currentDay} hari Ramadhan.
                Semoga Allah SWT menerima semua ibadah dan amal baik Anda.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedTab === 'calendar' && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Kalender Ramadhan</h2>
            <p className="text-sm text-slate-400">
              Lihat progress harian selama bulan Ramadhan
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-slate-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                <div
                  key={day}
                  className={`aspect-square flex items-center justify-center text-sm rounded-lg border transition-colors ${
                    day === progress.currentDay
                      ? 'bg-purple-600 border-purple-500 text-white font-bold'
                      : day < progress.currentDay
                      ? 'bg-green-600/20 border-green-500/30 text-green-400'
                      : 'bg-slate-700/50 border-slate-600 text-slate-400'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center space-x-6 mt-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-600 rounded"></div>
                <span className="text-slate-400">Selesai</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-600 rounded"></div>
                <span className="text-slate-400">Hari Ini</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-slate-600 rounded"></div>
                <span className="text-slate-400">Akan Datang</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
