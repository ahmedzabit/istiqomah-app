'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, UserIcon, CalendarIcon, ChartBarIcon, FireIcon, CheckCircleIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { getUserDetailForAdmin, getUserIbadahHistory, deleteUserAccount, getUserDeletionImpact } from '@/lib/supabase/database';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  is_admin: boolean;
  created_at: string;
  last_sign_in_at: string | null;
}

interface UserDetailModalProps {
  user: UserProfile;
  onClose: () => void;
  onUserDeleted?: () => void;
  onAdminToggled?: () => void;
}

interface UserDetail {
  profile: UserProfile;
  userIbadah: any[];
  totalRecords: number;
  recentRecords: any[];
  statistics: {
    activeIbadahCount: number;
    completedToday: number;
    currentStreak: number;
    weeklyActivity: Array<{
      date: string;
      day: string;
      completed: number;
      total: number;
    }>;
  };
}

export function UserDetailModal({ user, onClose, onUserDeleted, onAdminToggled }: UserDetailModalProps) {
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'ibadah' | 'history'>('overview');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deletionImpact, setDeletionImpact] = useState<any>(null);

  useEffect(() => {
    loadUserDetail();
  }, [user.id]);

  const loadUserDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const detail = await getUserDetailForAdmin(user.id);
      setUserDetail(detail);
    } catch (err: any) {
      console.error('Error loading user detail:', err);
      setError(err.message || 'Gagal memuat detail pengguna');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Belum pernah';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCompletionRate = () => {
    if (!userDetail?.statistics.weeklyActivity.length) return 0;
    const totalPossible = userDetail.statistics.weeklyActivity.reduce((acc, day) => acc + day.total, 0);
    const totalCompleted = userDetail.statistics.weeklyActivity.reduce((acc, day) => acc + day.completed, 0);
    return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
  };

  const handleDeleteUser = async () => {
    try {
      setDeleteLoading(true);
      await deleteUserAccount(user.id);
      onUserDeleted?.();
      onClose();
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError(err.message || 'Gagal menghapus akun pengguna');
    } finally {
      setDeleteLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleShowDeleteModal = async () => {
    try {
      const impact = await getUserDeletionImpact(user.id);
      setDeletionImpact(impact);
      setShowDeleteModal(true);
    } catch (err: any) {
      console.error('Error getting deletion impact:', err);
      setError('Gagal memuat informasi penghapusan');
    }
  };

  const handleToggleAdmin = async () => {
    try {
      // This would need to be implemented in the parent component
      // For now, we'll just call the callback
      onAdminToggled?.();
    } catch (err: any) {
      console.error('Error toggling admin status:', err);
      setError('Gagal mengubah status admin');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
          <p className="text-white mt-4 text-center">Memuat detail pengguna...</p>
        </div>
      </div>
    );
  }

  // Delete Confirmation Modal
  if (showDeleteModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-slate-800 rounded-lg max-w-md w-full">
          <div className="flex items-center justify-between p-6 border-b border-slate-700">
            <h2 className="text-xl font-semibold text-white">Konfirmasi Hapus Akun</h2>
            <button
              onClick={() => setShowDeleteModal(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-white mb-2">
                  Hapus akun "{user.full_name || user.email}"?
                </h3>

                <div className="space-y-3">
                  <p className="text-slate-300">
                    Tindakan ini akan menghapus <strong>PERMANEN</strong> semua data pengguna:
                  </p>

                  {deletionImpact && (
                    <ul className="list-disc list-inside text-sm text-slate-400 space-y-1">
                      <li><strong>{deletionImpact.recordsCount}</strong> record tracking ibadah</li>
                      <li><strong>{deletionImpact.ibadahCount}</strong> pengaturan ibadah</li>
                      <li><strong>{deletionImpact.customIbadahCount}</strong> ibadah custom yang dibuat</li>
                      <li>Profil dan akun pengguna</li>
                    </ul>
                  )}

                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-300 text-sm">
                      <strong>PERINGATAN:</strong> Data yang dihapus tidak dapat dikembalikan!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 p-6 border-t border-slate-700 bg-slate-700/30">
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteLoading}
              className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleDeleteUser}
              disabled={deleteLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {deleteLoading ? 'Menghapus...' : 'Hapus Permanen'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold text-white">
                {(user.full_name || user.email).charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {user.full_name || 'Nama belum diatur'}
              </h2>
              <p className="text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {error ? (
          <div className="p-6">
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex items-center justify-between border-b border-slate-700">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'overview'
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('ibadah')}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'ibadah'
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Ibadah ({userDetail?.userIbadah.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'history'
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Riwayat
                </button>
              </div>

              {/* Admin Actions */}
              <div className="flex items-center space-x-2 px-6">
                <button
                  onClick={handleToggleAdmin}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    user.is_admin
                      ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                      : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                  }`}
                >
                  {user.is_admin ? 'Hapus Admin' : 'Jadikan Admin'}
                </button>
                <button
                  onClick={handleShowDeleteModal}
                  className="px-3 py-1 rounded text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center space-x-1"
                >
                  <TrashIcon className="w-3 h-3" />
                  <span>Hapus Akun</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {activeTab === 'overview' && userDetail && (
                <div className="space-y-6">
                  {/* Stats Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <ChartBarIcon className="w-5 h-5 text-blue-400" />
                        <span className="text-sm text-slate-400">Ibadah Aktif</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {userDetail.statistics.activeIbadahCount}
                      </div>
                    </div>

                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircleIcon className="w-5 h-5 text-green-400" />
                        <span className="text-sm text-slate-400">Hari Ini</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {userDetail.statistics.completedToday}
                      </div>
                    </div>

                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <FireIcon className="w-5 h-5 text-orange-400" />
                        <span className="text-sm text-slate-400">Streak</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {userDetail.statistics.currentStreak}
                      </div>
                      <div className="text-xs text-slate-500">hari berturut</div>
                    </div>

                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <CalendarIcon className="w-5 h-5 text-purple-400" />
                        <span className="text-sm text-slate-400">Total Records</span>
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {userDetail.totalRecords}
                      </div>
                    </div>
                  </div>

                  {/* Weekly Activity */}
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Aktivitas 7 Hari Terakhir</h3>
                    <div className="grid grid-cols-7 gap-2">
                      {userDetail.statistics.weeklyActivity.map((day, index) => (
                        <div key={index} className="text-center">
                          <div className="text-xs text-slate-400 mb-2">{day.day}</div>
                          <div className={`w-full h-12 rounded-lg flex items-center justify-center text-sm font-medium ${
                            day.completed > 0 
                              ? 'bg-green-600 text-white' 
                              : day.total > 0 
                                ? 'bg-slate-600 text-slate-300'
                                : 'bg-slate-700 text-slate-500'
                          }`}>
                            {day.total > 0 ? `${day.completed}/${day.total}` : '-'}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 text-center">
                      <span className="text-sm text-slate-400">
                        Tingkat penyelesaian: <span className="text-white font-medium">{getCompletionRate()}%</span>
                      </span>
                    </div>
                  </div>

                  {/* Profile Info */}
                  <div className="bg-slate-700/30 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Informasi Profil</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Email:</span>
                        <div className="text-white">{user.email}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Role:</span>
                        <div className="text-white">{user.is_admin ? 'Administrator' : 'Pengguna'}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Bergabung:</span>
                        <div className="text-white">{formatDate(user.created_at)}</div>
                      </div>
                      <div>
                        <span className="text-slate-400">Login Terakhir:</span>
                        <div className="text-white">{formatDate(user.last_sign_in_at)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'ibadah' && userDetail && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Daftar Ibadah Pengguna</h3>
                  {userDetail.userIbadah.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-400">Pengguna belum menambahkan ibadah</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userDetail.userIbadah.map((ibadah) => (
                        <div key={ibadah.id} className="bg-slate-700/50 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-white">{ibadah.ibadah_types.name}</h4>
                              {ibadah.ibadah_types.description && (
                                <p className="text-sm text-slate-400 mt-1">{ibadah.ibadah_types.description}</p>
                              )}
                              <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                                <span>Jenis: {ibadah.ibadah_types.tracking_type === 'checklist' ? 'Checklist' : 'Hitung'}</span>
                                {ibadah.ibadah_types.tracking_type === 'count' && (
                                  <span>Target: {ibadah.target_count} {ibadah.unit || ibadah.ibadah_types.unit || ''}</span>
                                )}
                                <span>Frekuensi: {ibadah.ibadah_types.frequency}</span>
                              </div>
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-medium ${
                              ibadah.is_active 
                                ? 'bg-green-600/20 text-green-400' 
                                : 'bg-slate-600/20 text-slate-400'
                            }`}>
                              {ibadah.is_active ? 'Aktif' : 'Nonaktif'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && userDetail && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Riwayat Tracking Terbaru</h3>
                  {userDetail.recentRecords.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-400">Belum ada riwayat tracking</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {userDetail.recentRecords.slice(0, 20).map((record) => (
                        <div key={record.id} className="bg-slate-700/50 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-white">{record.ibadah_types?.name}</span>
                                <span className="text-xs text-slate-400">
                                  {new Date(record.date).toLocaleDateString('id-ID')}
                                </span>
                              </div>
                              <div className="text-sm text-slate-400 mt-1">
                                {record.is_completed ? 'Selesai' : `${record.count_value || 0} dari target`}
                              </div>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${
                              record.is_completed || record.count_value > 0 
                                ? 'bg-green-400' 
                                : 'bg-slate-500'
                            }`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
