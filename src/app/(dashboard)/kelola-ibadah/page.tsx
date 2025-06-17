'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/lib/constants';
import { ArrowLeftIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { getAllUserIbadah, hardDeleteUserIbadah } from '@/lib/supabase/database';
import { EditIbadahModal } from '@/components/dashboard/EditIbadahModal';
import { DeleteConfirmModal } from '@/components/dashboard/DeleteConfirmModal';

interface UserIbadahData {
  id: string;
  target_count: number;
  unit: string | null;
  is_active: boolean;
  created_at: string;
  ibadah_types: {
    id: string;
    name: string;
    description: string | null;
    tracking_type: 'checklist' | 'count';
    frequency: 'daily' | 'weekly' | 'monthly';
    unit: string | null;
    schedule_type: 'always' | 'date_range' | 'specific_dates' | 'ramadhan_auto';
    start_date: string | null;
    end_date: string | null;
    specific_dates: string[] | null;
    is_default: boolean;
    is_ramadhan_only: boolean;
    created_by: string | null;
  };
}

export default function KelolaIbadahPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [ibadahList, setIbadahList] = useState<UserIbadahData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingIbadah, setEditingIbadah] = useState<UserIbadahData | null>(null);
  const [deletingIbadah, setDeletingIbadah] = useState<UserIbadahData | null>(null);

  // Get user on component mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        await loadIbadahList(user.id);
      }
    };
    getUser();
  }, [supabase.auth]);

  const loadIbadahList = async (userId: string) => {
    try {
      setLoading(true);
      const data = await getAllUserIbadah(userId);
      setIbadahList(data);
    } catch (error) {
      console.error('Error loading ibadah list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (ibadah: UserIbadahData) => {
    setEditingIbadah(ibadah);
  };

  const handleDelete = (ibadah: UserIbadahData) => {
    setDeletingIbadah(ibadah);
  };

  const handleEditSave = async () => {
    if (user) {
      await loadIbadahList(user.id);
      setEditingIbadah(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingIbadah || !user) return;

    try {
      await hardDeleteUserIbadah(
        deletingIbadah.id,
        deletingIbadah.ibadah_types.id,
        user.id
      );
      
      await loadIbadahList(user.id);
      setDeletingIbadah(null);
    } catch (error) {
      console.error('Error deleting ibadah:', error);
      alert('Gagal menghapus ibadah. Silakan coba lagi.');
    }
  };

  const getScheduleText = (ibadah: UserIbadahData) => {
    const type = ibadah.ibadah_types;
    switch (type.schedule_type) {
      case 'always':
        return 'Selalu Aktif';
      case 'date_range':
        return `${type.start_date} s/d ${type.end_date}`;
      case 'specific_dates':
        return `${type.specific_dates?.length || 0} tanggal tertentu`;
      case 'ramadhan_auto':
        return 'Otomatis Ramadhan';
      default:
        return 'Selalu Aktif';
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-gray-100 text-gray-800'
      }`}>
        {isActive ? 'Aktif' : 'Nonaktif'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat daftar ibadah...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href={ROUTES.DASHBOARD}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Kembali
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Kelola Ibadah</h1>
              <p className="text-gray-600">Atur dan kelola jenis ibadah Anda</p>
            </div>
          </div>
          
          <Link href={ROUTES.TAMBAH_IBADAH}>
            <Button className="flex items-center space-x-2">
              <PlusIcon className="w-4 h-4" />
              <span>Tambah Ibadah</span>
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">
                  {ibadahList.length}
                </div>
                <div className="text-sm text-gray-600">Total Ibadah</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {ibadahList.filter(i => i.is_active).length}
                </div>
                <div className="text-sm text-gray-600">Aktif</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {ibadahList.filter(i => !i.is_active).length}
                </div>
                <div className="text-sm text-gray-600">Nonaktif</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ibadah List */}
        <div className="space-y-4">
          {ibadahList.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-500">
                  <p className="text-lg mb-2">Belum ada ibadah</p>
                  <p className="text-sm mb-4">Mulai dengan menambahkan ibadah pertama Anda</p>
                  <Link href={ROUTES.TAMBAH_IBADAH}>
                    <Button>
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Tambah Ibadah
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            ibadahList.map((ibadah) => (
              <Card key={ibadah.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {ibadah.ibadah_types.name}
                        </h3>
                        {getStatusBadge(ibadah.is_active)}
                        {ibadah.ibadah_types.is_default && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Default
                          </span>
                        )}
                      </div>
                      
                      {ibadah.ibadah_types.description && (
                        <p className="text-gray-600 mb-3">{ibadah.ibadah_types.description}</p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Jenis:</span>
                          <div className="text-gray-600">
                            {ibadah.ibadah_types.tracking_type === 'checklist' ? 'Checklist' : 'Hitung'}
                          </div>
                        </div>
                        
                        {ibadah.ibadah_types.tracking_type === 'count' && (
                          <div>
                            <span className="font-medium text-gray-700">Target:</span>
                            <div className="text-gray-600">
                              {ibadah.target_count} {ibadah.unit || ibadah.ibadah_types.unit || ''}
                            </div>
                          </div>
                        )}
                        
                        <div>
                          <span className="font-medium text-gray-700">Frekuensi:</span>
                          <div className="text-gray-600 capitalize">
                            {ibadah.ibadah_types.frequency === 'daily' ? 'Harian' : 
                             ibadah.ibadah_types.frequency === 'weekly' ? 'Mingguan' : 'Bulanan'}
                          </div>
                        </div>
                        
                        <div>
                          <span className="font-medium text-gray-700">Jadwal:</span>
                          <div className="text-gray-600">
                            {getScheduleText(ibadah)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(ibadah)}
                        className="flex items-center space-x-1"
                      >
                        <PencilIcon className="w-4 h-4" />
                        <span>Edit</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(ibadah)}
                        className="flex items-center space-x-1 text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <TrashIcon className="w-4 h-4" />
                        <span>Hapus</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingIbadah && (
        <EditIbadahModal
          ibadah={editingIbadah}
          onClose={() => setEditingIbadah(null)}
          onSave={handleEditSave}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingIbadah && (
        <DeleteConfirmModal
          ibadah={deletingIbadah}
          onClose={() => setDeletingIbadah(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
