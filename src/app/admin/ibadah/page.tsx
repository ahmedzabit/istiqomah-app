'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  UsersIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { 
  getAllIbadahTypes, 
  createDefaultIbadahType, 
  updateDefaultIbadahType, 
  deleteDefaultIbadahType,
  getIbadahTypeUsageStats
} from '@/lib/supabase/database';
import { CreateIbadahModal } from '@/components/admin/CreateIbadahModal';
import { EditIbadahModal } from '@/components/admin/EditIbadahModal';
import { DeleteIbadahModal } from '@/components/admin/DeleteIbadahModal';

interface IbadahTypeWithStats {
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
  created_at: string;
  updated_at: string;
  userCount?: number;
  recordCount?: number;
}

export default function AdminIbadahPage() {
  const [ibadahTypes, setIbadahTypes] = useState<IbadahTypeWithStats[]>([]);
  const [filteredTypes, setFilteredTypes] = useState<IbadahTypeWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'default' | 'custom' | 'ramadhan'>('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingIbadah, setEditingIbadah] = useState<IbadahTypeWithStats | null>(null);
  const [deletingIbadah, setDeletingIbadah] = useState<IbadahTypeWithStats | null>(null);

  useEffect(() => {
    loadIbadahTypes();
  }, []);

  useEffect(() => {
    filterIbadahTypes();
  }, [ibadahTypes, searchTerm, filterType]);

  const loadIbadahTypes = async () => {
    try {
      setLoading(true);
      const types = await getAllIbadahTypes();
      
      // Load usage stats for each type
      const typesWithStats = await Promise.all(
        types.map(async (type) => {
          try {
            const stats = await getIbadahTypeUsageStats(type.id);
            return { ...type, ...stats };
          } catch (error) {
            console.error(`Error loading stats for ${type.name}:`, error);
            return { ...type, userCount: 0, recordCount: 0 };
          }
        })
      );
      
      setIbadahTypes(typesWithStats);
    } catch (error) {
      console.error('Error loading ibadah types:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterIbadahTypes = () => {
    let filtered = ibadahTypes;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(type =>
        type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (type.description && type.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by type
    switch (filterType) {
      case 'default':
        filtered = filtered.filter(type => type.is_default && !type.is_ramadhan_only);
        break;
      case 'custom':
        filtered = filtered.filter(type => !type.is_default);
        break;
      case 'ramadhan':
        filtered = filtered.filter(type => type.is_ramadhan_only);
        break;
      default:
        // Show all
        break;
    }

    setFilteredTypes(filtered);
  };

  const handleCreate = async () => {
    await loadIbadahTypes();
    setShowCreateModal(false);
  };

  const handleEdit = async () => {
    await loadIbadahTypes();
    setEditingIbadah(null);
  };

  const handleDelete = async () => {
    await loadIbadahTypes();
    setDeletingIbadah(null);
  };

  const getTypeLabel = (type: IbadahTypeWithStats) => {
    if (type.is_ramadhan_only) return 'Ramadhan';
    if (type.is_default) return 'Default';
    return 'Custom';
  };

  const getTypeBadgeColor = (type: IbadahTypeWithStats) => {
    if (type.is_ramadhan_only) return 'bg-purple-100 text-purple-800';
    if (type.is_default) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getScheduleText = (type: IbadahTypeWithStats) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat data ibadah...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Ibadah Default</h1>
          <p className="text-gray-600">Atur jenis ibadah yang tersedia untuk semua pengguna</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2">
          <PlusIcon className="w-4 h-4" />
          <span>Tambah Ibadah</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{ibadahTypes.length}</div>
              <div className="text-sm text-gray-600">Total Ibadah</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {ibadahTypes.filter(t => t.is_default && !t.is_ramadhan_only).length}
              </div>
              <div className="text-sm text-gray-600">Default</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {ibadahTypes.filter(t => t.is_ramadhan_only).length}
              </div>
              <div className="text-sm text-gray-600">Ramadhan</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {ibadahTypes.filter(t => !t.is_default).length}
              </div>
              <div className="text-sm text-gray-600">Custom User</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Cari ibadah..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Semua</option>
                <option value="default">Default</option>
                <option value="ramadhan">Ramadhan</option>
                <option value="custom">Custom User</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ibadah List */}
      <div className="space-y-4">
        {filteredTypes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">
                <p className="text-lg mb-2">Tidak ada ibadah ditemukan</p>
                <p className="text-sm">Coba ubah filter atau kata kunci pencarian</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredTypes.map((type) => (
            <Card key={type.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{type.name}</h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(type)}`}>
                        {getTypeLabel(type)}
                      </span>
                    </div>
                    
                    {type.description && (
                      <p className="text-gray-600 mb-3">{type.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Jenis:</span>
                        <div className="text-gray-600">
                          {type.tracking_type === 'checklist' ? 'Checklist' : 'Hitung'}
                        </div>
                      </div>
                      
                      {type.tracking_type === 'count' && type.unit && (
                        <div>
                          <span className="font-medium text-gray-700">Satuan:</span>
                          <div className="text-gray-600">{type.unit}</div>
                        </div>
                      )}
                      
                      <div>
                        <span className="font-medium text-gray-700">Frekuensi:</span>
                        <div className="text-gray-600 capitalize">
                          {type.frequency === 'daily' ? 'Harian' : 
                           type.frequency === 'weekly' ? 'Mingguan' : 'Bulanan'}
                        </div>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-700">Jadwal:</span>
                        <div className="text-gray-600">{getScheduleText(type)}</div>
                      </div>
                      
                      <div>
                        <span className="font-medium text-gray-700">Pengguna:</span>
                        <div className="text-gray-600 flex items-center">
                          <UsersIcon className="w-4 h-4 mr-1" />
                          {type.userCount || 0}
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <ChartBarIcon className="w-4 h-4 mr-1" />
                        {type.recordCount || 0} records
                      </div>
                      <div>
                        Dibuat: {new Date(type.created_at).toLocaleDateString('id-ID')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingIbadah(type)}
                      className="flex items-center space-x-1"
                    >
                      <PencilIcon className="w-4 h-4" />
                      <span>Edit</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingIbadah(type)}
                      className="flex items-center space-x-1 text-red-600 border-red-300 hover:bg-red-50"
                      disabled={type.userCount && type.userCount > 0}
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

      {/* Modals */}
      {showCreateModal && (
        <CreateIbadahModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreate}
        />
      )}

      {editingIbadah && (
        <EditIbadahModal
          ibadah={editingIbadah}
          onClose={() => setEditingIbadah(null)}
          onSave={handleEdit}
        />
      )}

      {deletingIbadah && (
        <DeleteIbadahModal
          ibadah={deletingIbadah}
          onClose={() => setDeletingIbadah(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
