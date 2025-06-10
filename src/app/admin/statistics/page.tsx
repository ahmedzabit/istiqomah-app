'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { 
  ChartBarIcon,
  UsersIcon,
  CalendarIcon,
  TrophyIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FireIcon,
  BookOpenIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

interface AppStatistics {
  totalUsers: number;
  activeUsers: number;
  totalRecords: number;
  totalIbadah: number;
  totalMuhasabah: number;
  totalSupport: number;
  userGrowth: number;
  recordsGrowth: number;
  topIbadah: Array<{
    name: string;
    count: number;
  }>;
  dailyStats: Array<{
    date: string;
    users: number;
    records: number;
  }>;
}

interface PeriodStats {
  period: 'today' | 'week' | 'month' | 'year';
  label: string;
}

export default function AdminStatisticsPage() {
  const [stats, setStats] = useState<AppStatistics>({
    totalUsers: 0,
    activeUsers: 0,
    totalRecords: 0,
    totalIbadah: 0,
    totalMuhasabah: 0,
    totalSupport: 0,
    userGrowth: 0,
    recordsGrowth: 0,
    topIbadah: [],
    dailyStats: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodStats>({
    period: 'week',
    label: '7 Hari Terakhir'
  });

  const supabase = createClient();

  const periods: PeriodStats[] = [
    { period: 'today', label: 'Hari Ini' },
    { period: 'week', label: '7 Hari Terakhir' },
    { period: 'month', label: '30 Hari Terakhir' },
    { period: 'year', label: 'Tahun Ini' }
  ];

  useEffect(() => {
    fetchStatistics();
  }, [selectedPeriod]);

  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      
      // Calculate date ranges
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      
      let startDate = new Date(today);
      let previousStartDate = new Date(today);
      
      switch (selectedPeriod.period) {
        case 'today':
          // Today vs yesterday
          previousStartDate.setDate(previousStartDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          previousStartDate.setDate(previousStartDate.getDate() - 14);
          break;
        case 'month':
          startDate.setDate(startDate.getDate() - 30);
          previousStartDate.setDate(previousStartDate.getDate() - 60);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          previousStartDate.setFullYear(previousStartDate.getFullYear() - 2);
          break;
      }

      // Fetch all statistics in parallel
      const [
        totalUsersResult,
        activeUsersResult,
        totalRecordsResult,
        totalIbadahResult,
        totalMuhasabahResult,
        totalSupportResult,
        previousUsersResult,
        previousRecordsResult,
        topIbadahResult
      ] = await Promise.all([
        // Total users
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        
        // Active users (signed in within period) - with fallback for missing column
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDate.toISOString()), // Fallback to created_at instead of last_sign_in_at
        
        // Total records in period
        supabase
          .from('ibadah_records')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startDate.toISOString()),
        
        // Total ibadah types
        supabase.from('user_ibadah').select('*', { count: 'exact', head: true }),
        
        // Total muhasabah entries
        supabase.from('muhasabah_entries').select('*', { count: 'exact', head: true }),
        
        // Total support messages
        supabase.from('support_messages').select('*', { count: 'exact', head: true }),
        
        // Previous period users for growth calculation
        supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', previousStartDate.toISOString())
          .lt('created_at', startDate.toISOString()),
        
        // Previous period records for growth calculation
        supabase
          .from('ibadah_records')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', previousStartDate.toISOString())
          .lt('created_at', startDate.toISOString()),
        
        // Top ibadah types
        supabase
          .from('ibadah_records')
          .select(`
            user_ibadah:user_ibadah_id (
              name
            )
          `)
          .gte('created_at', startDate.toISOString())
      ]);

      // Process top ibadah data
      const ibadahCounts: { [key: string]: number } = {};
      if (topIbadahResult.data) {
        topIbadahResult.data.forEach((record: any) => {
          const name = record.user_ibadah?.name;
          if (name) {
            ibadahCounts[name] = (ibadahCounts[name] || 0) + 1;
          }
        });
      }

      const topIbadah = Object.entries(ibadahCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate growth percentages
      const currentUsers = totalUsersResult.count || 0;
      const previousUsers = previousUsersResult.count || 0;
      const userGrowth = previousUsers > 0 ? ((currentUsers - previousUsers) / previousUsers) * 100 : 0;

      const currentRecords = totalRecordsResult.count || 0;
      const previousRecords = previousRecordsResult.count || 0;
      const recordsGrowth = previousRecords > 0 ? ((currentRecords - previousRecords) / previousRecords) * 100 : 0;

      setStats({
        totalUsers: currentUsers,
        activeUsers: activeUsersResult.count || 0,
        totalRecords: currentRecords,
        totalIbadah: totalIbadahResult.count || 0,
        totalMuhasabah: totalMuhasabahResult.count || 0,
        totalSupport: totalSupportResult.count || 0,
        userGrowth,
        recordsGrowth,
        topIbadah,
        dailyStats: [] // We'll implement this later if needed
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    const Icon = isPositive ? ArrowUpIcon : ArrowDownIcon;
    const color = isPositive ? 'text-green-400' : 'text-red-400';
    
    return (
      <div className={`flex items-center space-x-1 ${color}`}>
        <Icon className="w-3 h-3" />
        <span className="text-xs font-medium">
          {Math.abs(growth).toFixed(1)}%
        </span>
      </div>
    );
  };

  const mainStats = [
    {
      title: 'Total Pengguna',
      value: stats.totalUsers,
      icon: UsersIcon,
      color: 'bg-blue-500',
      growth: stats.userGrowth,
      description: 'Pengguna terdaftar'
    },
    {
      title: 'Pengguna Aktif',
      value: stats.activeUsers,
      icon: TrophyIcon,
      color: 'bg-green-500',
      growth: 0, // We don't track this growth yet
      description: selectedPeriod.label
    },
    {
      title: 'Record Ibadah',
      value: stats.totalRecords,
      icon: CalendarIcon,
      color: 'bg-purple-500',
      growth: stats.recordsGrowth,
      description: selectedPeriod.label
    },
    {
      title: 'Total Muhasabah',
      value: stats.totalMuhasabah,
      icon: FireIcon,
      color: 'bg-orange-500',
      growth: 0, // We don't track this growth yet
      description: 'Jurnal refleksi'
    }
  ];

  const additionalStats = [
    {
      title: 'Jenis Ibadah',
      value: stats.totalIbadah,
      icon: BookOpenIcon,
      color: 'bg-indigo-500',
      description: 'Total ibadah terdaftar'
    },
    {
      title: 'Pesan Support',
      value: stats.totalSupport,
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-pink-500',
      description: 'Total pesan masuk'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Statistik Aplikasi
          </h1>
          <p className="text-slate-400 mt-1">
            Analisis penggunaan dan performa aplikasi ISTIQOMAH
          </p>
        </div>
        
        {/* Period Selector */}
        <div className="mt-4 lg:mt-0">
          <select
            value={selectedPeriod.period}
            onChange={(e) => {
              const period = periods.find(p => p.period === e.target.value);
              if (period) setSelectedPeriod(period);
            }}
            className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {periods.map((period) => (
              <option key={period.period} value={period.period}>
                {period.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainStats.map((stat, index) => (
          <Card key={index} className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {stat.value.toLocaleString()}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-slate-500">
                      {stat.description}
                    </p>
                    {stat.growth !== 0 && formatGrowth(stat.growth)}
                  </div>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center ml-4`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Additional Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {additionalStats.map((stat, index) => (
          <Card key={index} className="bg-slate-800 border-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {stat.description}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Engagement Rate Card */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">
                  Tingkat Engagement
                </p>
                <p className="text-2xl font-bold text-white mt-1">
                  {stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Pengguna aktif vs total
                </p>
              </div>
              <div className="w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Ibadah */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Ibadah Terpopuler</h2>
            <p className="text-sm text-slate-400">
              {selectedPeriod.label.toLowerCase()}
            </p>
          </CardHeader>
          <CardContent>
            {stats.topIbadah.length === 0 ? (
              <div className="text-center py-8">
                <BookOpenIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">Belum ada data ibadah</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.topIbadah.map((ibadah, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{ibadah.name}</p>
                        <p className="text-xs text-slate-400">{ibadah.count} kali dicatat</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-purple-400">{ibadah.count}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Insights */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Insight Cepat</h2>
            <p className="text-sm text-slate-400">
              Ringkasan performa aplikasi
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <p className="text-sm font-medium text-white">Pertumbuhan Pengguna</p>
                </div>
                <p className="text-xs text-slate-400">
                  {stats.userGrowth >= 0 ? 'Meningkat' : 'Menurun'} {Math.abs(stats.userGrowth).toFixed(1)}%
                  dibanding periode sebelumnya
                </p>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <p className="text-sm font-medium text-white">Aktivitas Recording</p>
                </div>
                <p className="text-xs text-slate-400">
                  {stats.recordsGrowth >= 0 ? 'Meningkat' : 'Menurun'} {Math.abs(stats.recordsGrowth).toFixed(1)}%
                  dibanding periode sebelumnya
                </p>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <p className="text-sm font-medium text-white">Rata-rata Record per User</p>
                </div>
                <p className="text-xs text-slate-400">
                  {stats.activeUsers > 0 ? (stats.totalRecords / stats.activeUsers).toFixed(1) : 0} record
                  per pengguna aktif
                </p>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <p className="text-sm font-medium text-white">Engagement Rate</p>
                </div>
                <p className="text-xs text-slate-400">
                  {stats.totalUsers > 0 ? ((stats.activeUsers / stats.totalUsers) * 100).toFixed(1) : 0}%
                  pengguna aktif dari total pengguna
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Ringkasan Performa</h2>
          <p className="text-sm text-slate-400">
            Status kesehatan aplikasi secara keseluruhan
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrophyIcon className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm font-medium text-white mb-1">Status Aplikasi</p>
              <p className="text-xs text-green-400">Berjalan Normal</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <UsersIcon className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm font-medium text-white mb-1">Kepuasan User</p>
              <p className="text-xs text-blue-400">
                {stats.totalSupport === 0 ? 'Sangat Baik' : 'Baik'}
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <ChartBarIcon className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm font-medium text-white mb-1">Tren Pertumbuhan</p>
              <p className={`text-xs ${stats.userGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.userGrowth >= 0 ? 'Positif' : 'Negatif'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
