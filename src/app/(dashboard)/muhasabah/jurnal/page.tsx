'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { getMuhasabahEntries } from '@/lib/supabase/database';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeftIcon,
  CalendarIcon,
  HeartIcon,
  FaceSmileIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { ROUTES } from '@/lib/constants';
import type { MuhasabahEntry } from '@/types';

const moodEmojis = {
  very_happy: '😊',
  happy: '🙂',
  neutral: '😐',
  sad: '😔',
  very_sad: '😢',
};

export default function MuhasabahJurnalPage() {
  const [entries, setEntries] = useState<MuhasabahEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<MuhasabahEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
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
      loadEntries();
    }
  }, [user]);

  useEffect(() => {
    filterEntries();
  }, [entries, searchQuery, dateFrom, dateTo]);

  const loadEntries = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getMuhasabahEntries(user.id);
      setEntries(data || []);
    } catch (err: any) {
      console.error('Error loading muhasabah entries:', err);
      setError('Gagal memuat jurnal muhasabah');
    } finally {
      setIsLoading(false);
    }
  };

  const filterEntries = () => {
    let filtered = [...entries];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.good_things.toLowerCase().includes(query) ||
        entry.improvements.toLowerCase().includes(query) ||
        entry.prayers_hopes.toLowerCase().includes(query)
      );
    }

    // Filter by date range
    if (dateFrom) {
      filtered = filtered.filter(entry => entry.date >= dateFrom);
    }
    if (dateTo) {
      filtered = filtered.filter(entry => entry.date <= dateTo);
    }

    setFilteredEntries(filtered);
  };

  const toggleExpanded = (entryId: string) => {
    const newExpanded = new Set(expandedEntries);
    if (newExpanded.has(entryId)) {
      newExpanded.delete(entryId);
    } else {
      newExpanded.add(entryId);
    }
    setExpandedEntries(newExpanded);
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Link
          href="/muhasabah"
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Jurnal Muhasabah</h1>
          <p className="text-gray-600">Lihat kembali refleksi harian Anda</p>
        </div>
        <Link
          href="/muhasabah"
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          Tulis Muhasabah
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cari dalam jurnal
              </label>
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Cari kata kunci..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dari tanggal
              </label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sampai tanggal
              </label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
          {(searchQuery || dateFrom || dateTo) && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Menampilkan {filteredEntries.length} dari {entries.length} entri
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
              >
                Hapus Filter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Memuat jurnal...</p>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <Button onClick={loadEntries} className="mt-4">
                Coba Lagi
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : filteredEntries.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {entries.length === 0 ? 'Belum ada jurnal muhasabah' : 'Tidak ada hasil'}
              </h3>
              <p className="text-gray-500 mb-6">
                {entries.length === 0 
                  ? 'Mulai tulis muhasabah harian untuk melihat jurnal Anda di sini'
                  : 'Coba ubah filter pencarian Anda'
                }
              </p>
              {entries.length === 0 && (
                <Link
                  href="/muhasabah"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Tulis Muhasabah Pertama
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => {
            const isExpanded = expandedEntries.has(entry.id);
            return (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CalendarIcon className="w-5 h-5 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-900">
                        {formatDate(new Date(entry.date), 'EEEE, dd MMMM yyyy')}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-3">
                      {entry.mood && (
                        <div className="text-xl">
                          {moodEmojis[entry.mood as keyof typeof moodEmojis]}
                        </div>
                      )}
                      <button
                        onClick={() => toggleExpanded(entry.id)}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUpIcon className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Compact Preview - Ultra minimal */}
                  {!isExpanded && (
                    <div className="py-1">
                      {/* No content in compact view - just date and emoji in header */}
                    </div>
                  )}

                  {/* Full Detail */}
                  {isExpanded && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <HeartIcon className="w-4 h-4 text-green-500" />
                          <h4 className="font-medium text-gray-900">Hal Baik Hari Ini</h4>
                        </div>
                        <p className="text-gray-700 bg-green-50 p-3 rounded-lg">
                          {entry.good_things}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <FaceSmileIcon className="w-4 h-4 text-blue-500" />
                          <h4 className="font-medium text-gray-900">Yang Bisa Ditingkatkan</h4>
                        </div>
                        <p className="text-gray-700 bg-blue-50 p-3 rounded-lg">
                          {entry.improvements}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-purple-500">🤲</span>
                          <h4 className="font-medium text-gray-900">Doa & Harapan</h4>
                        </div>
                        <p className="text-gray-700 bg-purple-50 p-3 rounded-lg">
                          {entry.prayers_hopes}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>
                            Ditulis pada {formatDate(new Date(entry.created_at), 'dd MMM yyyy, HH:mm')}
                          </span>
                          <Link
                            href={`/muhasabah?date=${entry.date}`}
                            className="text-purple-600 hover:text-purple-700 font-medium"
                          >
                            Edit
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
