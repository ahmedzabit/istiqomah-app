'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { isRamadhanFeatureEnabled } from '@/lib/supabase/database';
import { 
  UsersIcon, 
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  ClockIcon,
  TrophyIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalRecords: number;
  pendingSupport: number;
  todayRegistrations: number;
  systemHealth: 'good' | 'warning' | 'error';
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalRecords: 0,
    pendingSupport: 0,
    todayRegistrations: 0,
    systemHealth: 'good'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [ramadhanEnabled, setRamadhanEnabled] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Check if user is admin first
        const { data: currentUser } = await supabase.auth.getUser();
        if (!currentUser.user) {
          console.error('No authenticated user found');
          setStats(prev => ({ ...prev, systemHealth: 'error' }));
          setIsLoading(false);
          return;
        }

        // Get current user profile to check admin status
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', currentUser.user.id)
          .single();

        if (profileError || !userProfile?.is_admin) {
          console.error('User is not admin or profile error:', profileError);
          setStats(prev => ({ ...prev, systemHealth: 'error' }));
          setIsLoading(false);
          return;
        }

        // Get total users
        let totalUsers = 0;
        try {
          const { count, error: usersError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

          if (usersError) {
            console.error('Error fetching users count:', usersError);
            totalUsers = 0; // Fallback value
          } else {
            totalUsers = count || 0;
          }
        } catch (error) {
          console.error('Unexpected error fetching users count:', error);
          totalUsers = 0;
        }

        // Get active users (users with records in last 7 days)
        let activeUsers = 0;
        try {
          const { count, error: activeError } = await supabase
            .from('ibadah_records')
            .select('user_id', { count: 'exact', head: true })
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

          if (activeError) {
            console.error('Error fetching active users:', activeError);
            activeUsers = 0;
          } else {
            activeUsers = count || 0;
          }
        } catch (error) {
          console.error('Unexpected error fetching active users:', error);
          activeUsers = 0;
        }

        // Get total records today
        let totalRecords = 0;
        try {
          const today = new Date().toISOString().split('T')[0];
          const { count, error: recordsError } = await supabase
            .from('ibadah_records')
            .select('*', { count: 'exact', head: true })
            .eq('date', today);

          if (recordsError) {
            console.error('Error fetching records count:', recordsError);
            totalRecords = 0;
          } else {
            totalRecords = count || 0;
          }
        } catch (error) {
          console.error('Unexpected error fetching records count:', error);
          totalRecords = 0;
        }

        // Get pending support messages
        let pendingSupport = 0;
        try {
          const { count, error: supportError } = await supabase
            .from('support_messages')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'open');

          if (supportError) {
            console.error('Error fetching support messages:', supportError);
            pendingSupport = 0;
          } else {
            pendingSupport = count || 0;
          }
        } catch (error) {
          console.error('Unexpected error fetching support messages:', error);
          pendingSupport = 0;
        }

        // Get today's registrations
        let todayRegistrations = 0;
        try {
          const { count, error: regError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', new Date().toISOString().split('T')[0]);

          if (regError) {
            console.error('Error fetching registrations:', regError);
            todayRegistrations = 0;
          } else {
            todayRegistrations = count || 0;
          }
        } catch (error) {
          console.error('Unexpected error fetching registrations:', error);
          todayRegistrations = 0;
        }

        // Get recent activity - simplified approach
        let recentRecords = [];
        try {
          // First, get recent records with ibadah types
          const { data: recordsData, error: recordsError } = await supabase
            .from('ibadah_records')
            .select(`
              *,
              ibadah_types!inner(name)
            `)
            .order('created_at', { ascending: false })
            .limit(10);

          if (recordsError) {
            console.error('Error fetching recent records:', recordsError);
            recentRecords = [];
          } else if (recordsData && recordsData.length > 0) {
            // Get unique user IDs from the records
            const userIds = [...new Set(recordsData.map(record => record.user_id))];

            // Fetch profile data for these users
            const { data: profilesData, error: profilesError } = await supabase
              .from('profiles')
              .select('id, full_name, email')
              .in('id', userIds);

            if (profilesError) {
              console.warn('Could not fetch profile data:', profilesError);
              // Use records without profile data
              recentRecords = recordsData.map(record => ({
                ...record,
                profiles: null
              }));
            } else {
              // Merge records with profile data
              const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
              recentRecords = recordsData.map(record => ({
                ...record,
                profiles: profilesMap.get(record.user_id) || null
              }));
            }
          } else {
            recentRecords = [];
          }
        } catch (error) {
          console.error('Error fetching recent activity:', error);
          recentRecords = [];
        }

        setStats({
          totalUsers: totalUsers || 0,
          activeUsers: activeUsers || 0,
          totalRecords: totalRecords || 0,
          pendingSupport: pendingSupport || 0,
          todayRegistrations: todayRegistrations || 0,
          systemHealth: 'good'
        });

        setRecentActivity(recentRecords);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setStats(prev => ({ ...prev, systemHealth: 'error' }));
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();

    // Check Ramadhan feature status
    const checkRamadhanStatus = async () => {
      try {
        const enabled = await isRamadhanFeatureEnabled();
        setRamadhanEnabled(enabled);
      } catch (error) {
        console.error('Error checking Ramadhan status:', error);
        // Set to false as fallback to prevent dashboard crash
        setRamadhanEnabled(false);
      }
    };

    checkRamadhanStatus();
  }, [supabase]);



  const statCards = [
    {
      title: 'Total Pengguna',
      value: stats.totalUsers,
      icon: UsersIcon,
      color: 'bg-blue-500',
      change: `+${stats.todayRegistrations} hari ini`
    },
    {
      title: 'Pengguna Aktif',
      value: stats.activeUsers,
      icon: TrophyIcon,
      color: 'bg-green-500',
      change: '7 hari terakhir'
    },
    {
      title: 'Record Hari Ini',
      value: stats.totalRecords,
      icon: ChartBarIcon,
      color: 'bg-purple-500',
      change: 'Tracking ibadah'
    },
    {
      title: 'Support Pending',
      value: stats.pendingSupport,
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-orange-500',
      change: 'Perlu ditangani'
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
            Admin Dashboard
          </h1>
          <p className="text-slate-400 mt-1">
            Monitoring dan pengelolaan aplikasi ISTIQOMAH
          </p>
        </div>
        
        <div className="mt-4 lg:mt-0 flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
            stats.systemHealth === 'good' ? 'bg-green-900/20 text-green-400' :
            stats.systemHealth === 'warning' ? 'bg-yellow-900/20 text-yellow-400' :
            'bg-red-900/20 text-red-400'
          }`}>
            {stats.systemHealth === 'good' ? (
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            ) : stats.systemHealth === 'warning' ? (
              <ClockIcon className="w-4 h-4" />
            ) : (
              <ExclamationTriangleIcon className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {stats.systemHealth === 'good' ? 'Sistem Normal' :
               stats.systemHealth === 'warning' ? 'Perlu Perhatian' :
               'Ada Masalah'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card key={index} className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-1">{stat.change}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Aktivitas Terbaru</h2>
            <p className="text-sm text-slate-400">
              Tracking ibadah terbaru dari pengguna
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-slate-700/50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {activity.profiles?.full_name?.charAt(0) ||
                       activity.profiles?.email?.charAt(0) ||
                       activity.user_id?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {activity.profiles?.full_name ||
                       activity.profiles?.email ||
                       `User ${activity.user_id?.slice(-4) || 'Unknown'}`}
                    </p>
                    <p className="text-xs text-slate-400">
                      {activity.is_completed ? 'Menyelesaikan' : 'Memperbarui'} {activity.ibadah_types?.name || 'Ibadah'}
                    </p>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(activity.created_at).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-slate-400">Belum ada aktivitas hari ini</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <h2 className="text-lg font-semibold text-white">Aksi Cepat</h2>
            <p className="text-sm text-slate-400">
              Fitur yang sering digunakan
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <a
                href="/admin/users"
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-slate-700 rounded-lg transition-colors"
              >
                <UsersIcon className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-white">Kelola Pengguna</span>
              </a>

              <a
                href="/admin/support"
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-white">Balas Support</span>
              </a>

              <a
                href="/admin/statistics"
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ChartBarIcon className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-white">Lihat Statistik</span>
              </a>

              <a
                href="/admin/settings"
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ClockIcon className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-white">Pengaturan</span>
              </a>

              {/* Ramadhan Feature Status */}
              <div className="border-t border-slate-700 pt-3">
                <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-white">Fitur Ramadhan</p>
                    <p className="text-xs text-slate-400">
                      {ramadhanEnabled ? 'Aktif - Menu tersedia' : 'Nonaktif - Menu tersembunyi'}
                    </p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${ramadhanEnabled ? 'bg-green-400' : 'bg-red-400'}`}></div>
                </div>
              </div>


            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
