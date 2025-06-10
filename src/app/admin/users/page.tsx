'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  CalendarIcon,
  ChartBarIcon,
  EyeIcon,
  PencilIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  total_records?: number;
  active_days?: number;
}

interface UserStats {
  totalUsers: number;
  adminUsers: number;
  activeUsers: number;
  newUsersToday: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    adminUsers: 0,
    activeUsers: 0,
    newUsersToday: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasAccessError, setHasAccessError] = useState(false);
  const usersPerPage = 10;

  const supabase = createClient();

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [currentPage, searchTerm, filterRole]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const offset = (currentPage - 1) * usersPerPage;

      let query = supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          is_admin,
          created_at,
          last_sign_in_at
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + usersPerPage - 1);

      // Apply search filter
      if (searchTerm) {
        query = query.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      // Apply role filter
      if (filterRole !== 'all') {
        query = query.eq('is_admin', filterRole === 'admin');
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Detailed error fetching users:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        // Handle specific error cases
        if (error.code === '42501' || error.message.includes('permission denied')) {
          setHasAccessError(true);
          throw new Error('Akses ditolak. Pastikan Anda memiliki hak admin dan RLS policy sudah dikonfigurasi.');
        } else if (error.code === '42P01') {
          throw new Error('Tabel profiles tidak ditemukan. Silakan jalankan migrasi database.');
        } else if (error.message.includes('last_sign_in_at') && error.message.includes('does not exist')) {
          // Handle missing column - try fallback query without last_sign_in_at
          console.warn('last_sign_in_at column missing, trying fallback query...');

          let fallbackQuery = supabase
            .from('profiles')
            .select(`
              id,
              email,
              full_name,
              is_admin,
              created_at
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + usersPerPage - 1);

          // Apply same filters
          if (searchTerm) {
            fallbackQuery = fallbackQuery.or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
          }
          if (filterRole !== 'all') {
            fallbackQuery = fallbackQuery.eq('is_admin', filterRole === 'admin');
          }

          const { data: fallbackData, error: fallbackError, count: fallbackCount } = await fallbackQuery;

          if (fallbackError) {
            throw new Error(`Gagal memuat data pengguna: ${fallbackError.message}`);
          }

          // Add null last_sign_in_at to fallback data
          const usersWithNullSignIn = (fallbackData || []).map(user => ({
            ...user,
            last_sign_in_at: null
          }));

          setUsers(usersWithNullSignIn);
          setTotalPages(Math.ceil((fallbackCount || 0) / usersPerPage));
          return; // Exit early, don't throw error
        } else {
          throw new Error(`Gagal memuat data pengguna: ${error.message}`);
        }
      }

      setUsers(data || []);
      setTotalPages(Math.ceil((count || 0) / usersPerPage));
    } catch (error: any) {
      console.error('Error fetching users:', error);
      // Show user-friendly error message
      alert(error.message || 'Gagal memuat data pengguna. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get total users
      const { count: totalUsers, error: totalError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        console.error('Error fetching total users:', totalError);
        return;
      }

      // Get admin users
      const { count: adminUsers, error: adminError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_admin', true);

      if (adminError) {
        console.error('Error fetching admin users:', adminError);
      }

      // Get users who signed in last 7 days
      let activeUsers = 0;
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { count, error: activeError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .gte('last_sign_in_at', sevenDaysAgo.toISOString());

        if (activeError) {
          console.error('Error fetching active users:', activeError);

          // If column doesn't exist, use total users as fallback
          if (activeError.message?.includes('last_sign_in_at') &&
              activeError.message?.includes('does not exist')) {
            console.warn('last_sign_in_at column missing - using total users as active users fallback');
            activeUsers = totalUsers || 0;
          }
        } else {
          activeUsers = count || 0;
        }
      } catch (error) {
        console.error('Unexpected error fetching active users:', error);
        activeUsers = 0;
      }

      // Get new users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: newUsersToday, error: newError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      if (newError) {
        console.error('Error fetching new users:', newError);
      }

      setStats({
        totalUsers: totalUsers || 0,
        adminUsers: adminUsers || 0,
        activeUsers: activeUsers || 0,
        newUsersToday: newUsersToday || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const toggleAdminStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      // Refresh users list
      fetchUsers();
      fetchStats();
    } catch (error) {
      console.error('Error updating admin status:', error);
      alert('Gagal mengubah status admin. Silakan coba lagi.');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Belum pernah';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statCards = [
    {
      title: 'Total Pengguna',
      value: stats.totalUsers,
      icon: UsersIcon,
      color: 'bg-blue-500',
      change: `+${stats.newUsersToday} hari ini`
    },
    {
      title: 'Administrator',
      value: stats.adminUsers,
      icon: ShieldCheckIcon,
      color: 'bg-purple-500',
      change: 'Total admin'
    },
    {
      title: 'Pengguna Aktif',
      value: stats.activeUsers,
      icon: ChartBarIcon,
      color: 'bg-green-500',
      change: '7 hari terakhir'
    },
    {
      title: 'Registrasi Baru',
      value: stats.newUsersToday,
      icon: UserPlusIcon,
      color: 'bg-orange-500',
      change: 'Hari ini'
    }
  ];

  // Show access error if RLS policies are not configured
  if (hasAccessError) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Manajemen Pengguna</h1>
          <p className="text-slate-400">Kelola pengguna dan hak akses admin</p>
        </div>

        <Card className="bg-red-900/20 border-red-500/30">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-400 mb-4">Akses Ditolak</h3>
              <p className="text-red-300 mb-6 max-w-2xl mx-auto">
                Anda tidak memiliki akses untuk melihat data pengguna. Hal ini terjadi karena:
              </p>
              <ul className="text-left text-red-300 mb-6 max-w-xl mx-auto space-y-2">
                <li>• RLS (Row Level Security) policies belum dikonfigurasi untuk admin</li>
                <li>• Akun Anda belum memiliki status admin yang valid</li>
                <li>• Database belum disetup dengan benar</li>
              </ul>
              <div className="bg-slate-800 p-4 rounded-lg text-left max-w-2xl mx-auto">
                <p className="text-slate-300 text-sm mb-2">
                  <strong>Solusi:</strong> Jalankan script SQL berikut di Supabase SQL Editor:
                </p>
                <code className="text-green-400 text-xs">
                  admin-profiles-access-fix.sql
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading && users.length === 0) {
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
            Manajemen Pengguna
          </h1>
          <p className="text-slate-400 mt-1">
            Kelola pengguna dan hak akses administrator
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
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
                    {stat.change}
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-slate-300">Filter:</label>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as 'all' | 'admin' | 'user')}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">Semua Pengguna</option>
                <option value="admin">Administrator</option>
                <option value="user">Pengguna Biasa</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Daftar Pengguna</h2>
          <p className="text-sm text-slate-400">
            Total {stats.totalUsers} pengguna terdaftar
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <UsersIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">Tidak ada pengguna ditemukan</p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Pengguna</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Bergabung</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Login Terakhir</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-300">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {(user.full_name || user.email).charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">
                                {user.full_name || 'Nama belum diatur'}
                              </p>
                              <p className="text-xs text-slate-400">ID: {user.id.slice(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-slate-300">{user.email}</p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            {user.is_admin ? (
                              <>
                                <ShieldCheckIcon className="w-4 h-4 text-purple-400" />
                                <span className="text-sm text-purple-400 font-medium">Admin</span>
                              </>
                            ) : (
                              <>
                                <UsersIcon className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-400">User</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-slate-300">{formatDate(user.created_at)}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm text-slate-300">{formatDate(user.last_sign_in_at)}</p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                user.is_admin
                                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                  : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                              }`}
                            >
                              {user.is_admin ? 'Hapus Admin' : 'Jadikan Admin'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {(user.full_name || user.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">
                          {user.full_name || 'Nama belum diatur'}
                        </p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {user.is_admin ? (
                          <ShieldCheckIcon className="w-4 h-4 text-purple-400" />
                        ) : (
                          <UsersIcon className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs text-slate-400 mb-3">
                      <div>
                        <p>Bergabung:</p>
                        <p className="text-slate-300">{formatDate(user.created_at)}</p>
                      </div>
                      <div>
                        <p>Login Terakhir:</p>
                        <p className="text-slate-300">{formatDate(user.last_sign_in_at)}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                      className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        user.is_admin
                          ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                          : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                      }`}
                    >
                      {user.is_admin ? 'Hapus Admin' : 'Jadikan Admin'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-700">
                  <p className="text-sm text-slate-400">
                    Halaman {currentPage} dari {totalPages}
                  </p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Sebelumnya
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
