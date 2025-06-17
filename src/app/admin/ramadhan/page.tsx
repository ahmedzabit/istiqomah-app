'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { 
  BookOpenIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CalendarIcon,
  StarIcon,
  EyeIcon,
  CheckCircleIcon
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

interface RamadhanStats {
  totalContent: number;
  completedDays: number;
}

export default function AdminRamadhanPage() {
  const [contents, setContents] = useState<RamadhanContent[]>([]);
  const [stats, setStats] = useState<RamadhanStats>({
    totalContent: 0,
    completedDays: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingContent, setEditingContent] = useState<RamadhanContent | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    ayat: '',
    hadis: '',
    tips: '',
    doa: ''
  });

  const supabase = createClient();

  useEffect(() => {
    fetchContents();
    fetchStats();
  }, []);

  const fetchContents = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('ramadhan_content')
        .select('*')
        .order('date', { ascending: true });

      if (error) throw error;

      setContents(data || []);
    } catch (error) {
      console.error('Error fetching Ramadhan content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get total content
      const { count: totalContent } = await supabase
        .from('ramadhan_content')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalContent: totalContent || 0,
        completedDays: Math.min(totalContent || 0, 30) // Max 30 days in Ramadhan
      });
    } catch (error) {
      console.error('Error fetching Ramadhan stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingContent) {
        // Update existing content
        const { error } = await supabase
          .from('ramadhan_content')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingContent.id);

        if (error) throw error;
      } else {
        // Create new content
        const { error } = await supabase
          .from('ramadhan_content')
          .insert([formData]);

        if (error) throw error;
      }

      // Reset form and refresh data
      setFormData({
        date: '',
        ayat: '',
        hadis: '',
        tips: '',
        doa: ''
      });
      setEditingContent(null);
      setShowForm(false);
      fetchContents();
      fetchStats();
    } catch (error) {
      console.error('Error saving Ramadhan content:', error);
      alert('Gagal menyimpan konten. Silakan coba lagi.');
    }
  };

  const handleEdit = (content: RamadhanContent) => {
    setEditingContent(content);
    setFormData({
      date: content.date,
      ayat: content.ayat || '',
      hadis: content.hadis || '',
      tips: content.tips || '',
      doa: content.doa || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus konten ini?')) return;

    try {
      const { error } = await supabase
        .from('ramadhan_content')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchContents();
      fetchStats();
    } catch (error) {
      console.error('Error deleting Ramadhan content:', error);
      alert('Gagal menghapus konten. Silakan coba lagi.');
    }
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const statCards = [
    {
      title: 'Total Konten',
      value: stats.totalContent,
      icon: BookOpenIcon,
      color: 'bg-blue-500',
      change: `${stats.completedDays}/30 hari`
    },
    {
      title: 'Hari Tersedia',
      value: stats.completedDays,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      change: 'Konten tersedia'
    },
    {
      title: 'Progress',
      value: `${Math.round((stats.completedDays / 30) * 100)}%`,
      icon: StarIcon,
      color: 'bg-purple-500',
      change: 'Kelengkapan Ramadhan'
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
            Konten Ramadhan
          </h1>
          <p className="text-slate-400 mt-1">
            Kelola konten harian untuk bulan Ramadhan
          </p>
        </div>
        <button
          onClick={() => {
            setEditingContent(null);
            setFormData({
              date: '',
              ayat: '',
              hadis: '',
              tips: '',
              doa: ''
            });
            setShowForm(true);
          }}
          className="mt-4 lg:mt-0 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Tambah Konten</span>
        </button>
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
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
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

      {/* Content List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Daftar Konten Ramadhan</h2>
          <p className="text-sm text-slate-400">
            {contents.length} konten tersedia
          </p>
        </CardHeader>
        <CardContent>
          {contents.length === 0 ? (
            <div className="text-center py-8">
              <BookOpenIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">Belum ada konten Ramadhan</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contents.map((content) => (
                <div key={content.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                        <CalendarIcon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xs text-slate-300">
                        {new Date(content.date).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEdit(content)}
                        className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(content.id)}
                        className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {content.ayat && (
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-purple-400 mb-1">Ayat:</h4>
                      <div className="bg-slate-600/50 rounded-lg p-2">
                        <p className="text-xs text-slate-300 italic">"{content.ayat}"</p>
                      </div>
                    </div>
                  )}

                  {content.hadis && (
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-green-400 mb-1">Hadis:</h4>
                      <p className="text-xs text-slate-400 line-clamp-2">{content.hadis}</p>
                    </div>
                  )}

                  {content.tips && (
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-blue-400 mb-1">Tips:</h4>
                      <p className="text-xs text-slate-400 line-clamp-2">{content.tips}</p>
                    </div>
                  )}

                  {content.doa && (
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-orange-400 mb-1">Doa:</h4>
                      <p className="text-xs text-slate-400 line-clamp-2">{content.doa}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      {formatDate(content.updated_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-white">
                  {editingContent ? 'Edit Konten Ramadhan' : 'Tambah Konten Ramadhan'}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Ayat Al-Quran (Opsional)
                  </label>
                  <textarea
                    value={formData.ayat}
                    onChange={(e) => setFormData({ ...formData, ayat: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Masukkan ayat dalam bahasa Arab..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Hadis (Opsional)
                  </label>
                  <textarea
                    value={formData.hadis}
                    onChange={(e) => setFormData({ ...formData, hadis: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Masukkan hadis..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Tips Ramadhan (Opsional)
                  </label>
                  <textarea
                    value={formData.tips}
                    onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Tips dan nasihat untuk hari ini..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Doa (Opsional)
                  </label>
                  <textarea
                    value={formData.doa}
                    onChange={(e) => setFormData({ ...formData, doa: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    placeholder="Doa untuk hari ini..."
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-700">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    {editingContent ? 'Update' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
