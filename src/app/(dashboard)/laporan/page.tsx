'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProgressRing } from '@/components/ui/ProgressRing';
import {
  CalendarIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  TrophyIcon,
  FunnelIcon,
  ArrowPathIcon,
  FireIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { formatDate, formatDateForDB } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { getIbadahRecordsForReport, getUserIbadah, getIbadahAnalytics, getMonthlyConsistencyData } from '@/lib/supabase/database';
import { MonthlyConsistencyChart } from '@/components/charts/MonthlyConsistencyChart';
import type { IbadahRecord, IbadahType, UserIbadah } from '@/types';

type FilterType = 'daily' | 'monthly' | 'yearly';

interface ReportData {
  records: (IbadahRecord & { ibadah_types: IbadahType })[];
  summary: {
    totalDays: number;
    completedDays: number;
    averageCompletion: number;
    totalRecords: number;
    completedRecords: number;
  };
}

interface IbadahAnalytics {
  ibadah_type_id: string;
  name: string;
  description: string | null;
  tracking_type: 'checklist' | 'count';
  target_count: number;
  unit: string | null;
  totalDays: number;
  recordedDays: number;
  completedDays: number;
  completionRate: number;
  averageCount: number;
  currentStreak: number;
  maxStreak: number;
  totalCount: number;
}

export default function LaporanPage() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('daily');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [userIbadah, setUserIbadah] = useState<(UserIbadah & { ibadah_types: IbadahType })[]>([]);
  const [showDownloadButton, setShowDownloadButton] = useState(false);
  const [analytics, setAnalytics] = useState<{
    topPerforming: IbadahAnalytics[];
    needsImprovement: IbadahAnalytics[];
  } | null>(null);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  // Auto-reset filters when filter type changes
  const resetFilters = () => {
    const today = new Date();
    const todayStr = formatDateForDB(today);

    switch (filterType) {
      case 'daily':
        setDateFrom(todayStr);
        setDateTo(todayStr);
        setSelectedMonth('');
        setSelectedYear('');
        break;
      case 'monthly':
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        setSelectedMonth(currentMonth);
        setDateFrom('');
        setDateTo('');
        setSelectedYear('');
        break;
      case 'yearly':
        setSelectedYear(today.getFullYear().toString());
        setDateFrom('');
        setDateTo('');
        setSelectedMonth('');
        break;
    }
    setReportData(null);
    setShowDownloadButton(false);
  };
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
      loadUserIbadah();
      // Initialize filters on first load
      if (!dateFrom && !dateTo && !selectedMonth && !selectedYear) {
        resetFilters();
      }
    }
  }, [user]);

  // Auto-reset when filter type changes
  useEffect(() => {
    resetFilters();
  }, [filterType]);

  useEffect(() => {
    // Set default values based on filter type
    const today = new Date();

    switch (filterType) {
      case 'daily':
        setDateFrom(formatDateForDB(today));
        setDateTo(formatDateForDB(today));
        break;
      case 'monthly':
        const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        setSelectedMonth(currentMonth);
        // Set date range for current month
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        setDateFrom(formatDateForDB(firstDay));
        setDateTo(formatDateForDB(lastDay));
        break;
      case 'yearly':
        const currentYear = today.getFullYear().toString();
        setSelectedYear(currentYear);
        // Set date range for current year
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1);
        const lastDayOfYear = new Date(today.getFullYear(), 11, 31);
        setDateFrom(formatDateForDB(firstDayOfYear));
        setDateTo(formatDateForDB(lastDayOfYear));
        break;
    }
  }, [filterType]);

  const loadUserIbadah = async () => {
    if (!user) return;

    try {
      const data = await getUserIbadah(user.id);
      setUserIbadah(data || []);
    } catch (err: any) {
      console.error('Error loading user ibadah:', err);
    }
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    if (month) {
      const [year, monthNum] = month.split('-');
      const firstDay = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const lastDay = new Date(parseInt(year), parseInt(monthNum), 0);
      setDateFrom(formatDateForDB(firstDay));
      setDateTo(formatDateForDB(lastDay));
    }
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    if (year) {
      const firstDay = new Date(parseInt(year), 0, 1);
      const lastDay = new Date(parseInt(year), 11, 31);
      setDateFrom(formatDateForDB(firstDay));
      setDateTo(formatDateForDB(lastDay));
    }
  };

  const loadReportData = async () => {
    if (!user || !dateFrom || !dateTo) return;

    setIsLoading(true);
    setError(null);
    setShowDownloadButton(false);

    try {
      // Load basic report data
      const records = await getIbadahRecordsForReport(user.id, dateFrom, dateTo);

      // Load analytics data
      const analyticsData = await getIbadahAnalytics(user.id, dateFrom, dateTo);
      setAnalytics(analyticsData);

      // Load monthly consistency data for yearly reports
      if (filterType === 'yearly' && selectedYear) {
        const monthlyConsistency = await getMonthlyConsistencyData(user.id, parseInt(selectedYear));
        setMonthlyData(monthlyConsistency);
      }

      // Calculate summary
      const uniqueDates = new Set(records.map(r => r.date));
      const totalDays = uniqueDates.size;

      const dailyCompletions = new Map();
      records.forEach(record => {
        const date = record.date;
        if (!dailyCompletions.has(date)) {
          dailyCompletions.set(date, { completed: 0, total: 0 });
        }

        const dayData = dailyCompletions.get(date);
        dayData.total++;

        const userIbadahItem = userIbadah.find(ui => ui.ibadah_type_id === record.ibadah_type_id);
        if (userIbadahItem) {
          const isCompleted = userIbadahItem.ibadah_types.tracking_type === 'checklist'
            ? record.is_completed
            : record.count_value >= userIbadahItem.target_count;

          if (isCompleted) {
            dayData.completed++;
          }
        }
      });

      const completedDays = Array.from(dailyCompletions.values())
        .filter(day => day.completed === day.total && day.total > 0).length;

      const totalRecords = records.length;
      const completedRecords = records.filter(record => {
        const userIbadahItem = userIbadah.find(ui => ui.ibadah_type_id === record.ibadah_type_id);
        if (!userIbadahItem) return false;

        return userIbadahItem.ibadah_types.tracking_type === 'checklist'
          ? record.is_completed
          : record.count_value >= userIbadahItem.target_count;
      }).length;

      const averageCompletion = totalRecords > 0 ? Math.round((completedRecords / totalRecords) * 100) : 0;

      setReportData({
        records,
        summary: {
          totalDays,
          completedDays,
          averageCompletion,
          totalRecords,
          completedRecords
        }
      });

      setShowDownloadButton(true);
    } catch (err: any) {
      console.error('Error loading report data:', err);
      setError('Gagal memuat data laporan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (!reportData || !user) return;

    setIsGenerating(true);

    try {
      // Dynamic import to avoid SSR issues
      const jsPDF = (await import('jspdf')).default;

      const doc = new jsPDF();

      // Set font
      doc.setFont('helvetica');

      // Header
      doc.setFontSize(20);
      doc.text('LAPORAN IBADAH ISTIQOMAH', 20, 20);

      doc.setFontSize(12);
      doc.text(`Nama: ${user.user_metadata?.full_name || user.email}`, 20, 35);
      doc.text(`Periode: ${formatDate(new Date(dateFrom), 'dd MMM yyyy')} - ${formatDate(new Date(dateTo), 'dd MMM yyyy')}`, 20, 45);
      doc.text(`Tanggal Cetak: ${formatDate(new Date(), 'dd MMM yyyy HH:mm')}`, 20, 55);

      // Summary
      doc.setFontSize(16);
      doc.text('RINGKASAN', 20, 75);

      doc.setFontSize(12);
      doc.text(`Total Hari: ${reportData.summary.totalDays}`, 20, 90);
      doc.text(`Hari Selesai: ${reportData.summary.completedDays}`, 20, 100);
      doc.text(`Rata-rata Penyelesaian: ${reportData.summary.averageCompletion}%`, 20, 110);
      doc.text(`Total Record: ${reportData.summary.totalRecords}`, 20, 120);
      doc.text(`Record Selesai: ${reportData.summary.completedRecords}`, 20, 130);

      // Records
      doc.setFontSize(16);
      doc.text('DETAIL RECORD', 20, 150);

      let yPos = 165;
      doc.setFontSize(10);

      reportData.records.slice(0, 20).forEach((record, index) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }

        const userIbadahItem = userIbadah.find(ui => ui.ibadah_type_id === record.ibadah_type_id);
        const isCompleted = userIbadahItem?.ibadah_types.tracking_type === 'checklist'
          ? record.is_completed
          : record.count_value >= (userIbadahItem?.target_count || 0);

        doc.text(`${formatDate(new Date(record.date), 'dd/MM/yyyy')} - ${record.ibadah_types.name}`, 20, yPos);
        doc.text(`Status: ${isCompleted ? 'Selesai' : 'Belum'}`, 120, yPos);

        if (record.ibadah_types.tracking_type === 'count') {
          doc.text(`${record.count_value}/${userIbadahItem?.target_count || 0}`, 160, yPos);
        }

        yPos += 10;
      });

      if (reportData.records.length > 20) {
        doc.text(`... dan ${reportData.records.length - 20} record lainnya`, 20, yPos + 10);
      }

      // Create filename based on filter type
      let filename = 'laporan-ibadah';

      switch (filterType) {
        case 'daily':
          filename += `-harian-${dateFrom}-${dateTo}`;
          break;
        case 'monthly':
          filename += `-bulanan-${selectedMonth}`;
          break;
        case 'yearly':
          filename += `-tahunan-${selectedYear}`;
          break;
      }

      filename += `.pdf`;

      // Save the PDF
      doc.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Gagal membuat PDF. Silakan coba lagi.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Laporan Ibadah
        </h1>
        <p className="text-gray-600 mt-1">
          Analisis progress dan perkembangan ibadah Anda
        </p>
      </div>

      {/* Filter & Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">Filter Laporan</h2>
          </div>
          <p className="text-sm text-gray-500">
            Pilih jenis filter dan rentang tanggal untuk melihat laporan
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filter Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jenis Filter
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'daily', label: 'Harian', desc: 'Pilih rentang tanggal' },
                  { value: 'monthly', label: 'Bulanan', desc: 'Pilih bulan tertentu' },
                  { value: 'yearly', label: 'Tahunan', desc: 'Pilih tahun tertentu' }
                ].map((filter) => (
                  <label
                    key={filter.value}
                    className={`cursor-pointer p-3 rounded-lg border-2 transition-all text-center ${
                      filterType === filter.value
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      value={filter.value}
                      checked={filterType === filter.value}
                      onChange={(e) => setFilterType(e.target.value as FilterType)}
                      className="sr-only"
                    />
                    <div className="font-medium">{filter.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{filter.desc}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* Dynamic Date Inputs */}
            <div className="space-y-4">
              {filterType === 'daily' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Mulai
                    </label>
                    <Input
                      type="date"
                      value={dateFrom}
                      max={formatDateForDB(new Date())}
                      onChange={(e) => setDateFrom(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tanggal Akhir
                    </label>
                    <Input
                      type="date"
                      value={dateTo}
                      max={formatDateForDB(new Date())}
                      onChange={(e) => setDateTo(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {filterType === 'monthly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih Bulan
                  </label>
                  <Input
                    type="month"
                    value={selectedMonth}
                    max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
                    onChange={(e) => handleMonthChange(e.target.value)}
                    className="w-full md:w-auto"
                  />
                  {selectedMonth && (
                    <div className="mt-2 text-sm text-gray-600">
                      Periode: {new Date(selectedMonth + '-01').toLocaleDateString('id-ID', {
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                  )}
                </div>
              )}

              {filterType === 'yearly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pilih Tahun
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => handleYearChange(e.target.value)}
                    className="w-full md:w-auto px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Pilih Tahun</option>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                  {selectedYear && (
                    <div className="mt-2 text-sm text-gray-600">
                      Periode: Tahun {selectedYear}
                    </div>
                  )}
                </div>
              )}

              <div className="text-xs text-gray-500">
                * Anda hanya dapat memilih periode hari ini atau sebelumnya
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={loadReportData}
                disabled={
                  isLoading ||
                  !dateFrom ||
                  !dateTo ||
                  (filterType === 'monthly' && !selectedMonth) ||
                  (filterType === 'yearly' && !selectedYear)
                }
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ChartBarIcon className="w-4 h-4 mr-2" />
                {isLoading ? 'Memuat...' : 'Tampilkan Data'}
              </Button>

              <Button
                onClick={resetFilters}
                disabled={isLoading}
                className="bg-gray-500 hover:bg-gray-600"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Reset Filter
              </Button>

              {showDownloadButton && (
                <Button
                  onClick={handleGeneratePDF}
                  disabled={isGenerating}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                  {isGenerating ? 'Generating...' : 'Download PDF'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Report Data Display */}
      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {reportData.summary.totalDays}
                    </div>
                    <div className="text-xs text-gray-500">Total Hari</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrophyIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {reportData.summary.completedDays}
                    </div>
                    <div className="text-xs text-gray-500">Hari Tercomplete</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {reportData.summary.averageCompletion}%
                    </div>
                    <div className="text-xs text-gray-500">Rata-rata</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <ChartBarIcon className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {reportData.summary.completedRecords}
                    </div>
                    <div className="text-xs text-gray-500">Record Selesai</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Analytics Section */}
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Performing Ibadah */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <TrophyIcon className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-lg font-semibold text-gray-900">5 Ibadah Paling Istiqomah</h3>
                  </div>
                  <p className="text-sm text-gray-500">
                    Ibadah dengan tingkat penyelesaian tertinggi
                  </p>
                </CardHeader>
                <CardContent>
                  {analytics.topPerforming.length === 0 ? (
                    <div className="text-center py-8">
                      <TrophyIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Belum ada data ibadah</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {analytics.topPerforming.map((ibadah, index) => (
                        <div key={ibadah.ibadah_type_id} className="flex items-center space-x-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                            index === 0 ? 'bg-yellow-500' :
                            index === 1 ? 'bg-gray-400' :
                            index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{ibadah.name}</div>
                            <div className="text-sm text-gray-500">
                              {ibadah.completedDays}/{ibadah.totalDays} hari
                              {ibadah.tracking_type === 'count' && ibadah.unit && (
                                <span> • Rata-rata: {ibadah.averageCount} {ibadah.unit}</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${Math.min(ibadah.completionRate, 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-green-600">
                                {ibadah.completionRate.toFixed(1)}%
                              </span>
                            </div>
                            {ibadah.currentStreak > 0 && (
                              <div className="flex items-center space-x-1 mt-1">
                                <FireIcon className="w-4 h-4 text-orange-500" />
                                <span className="text-xs text-orange-600">
                                  Streak: {ibadah.currentStreak} hari
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Needs Improvement */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <ArrowTrendingUpIcon className="w-5 h-5 text-red-500" />
                    <h3 className="text-lg font-semibold text-gray-900">5 Ibadah Perlu Ditingkatkan</h3>
                  </div>
                  <p className="text-sm text-gray-500">
                    Ibadah yang memerlukan perhatian lebih
                  </p>
                </CardHeader>
                <CardContent>
                  {analytics.needsImprovement.length === 0 ? (
                    <div className="text-center py-8">
                      <ArrowTrendingUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Belum ada data ibadah</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {analytics.needsImprovement.map((ibadah, index) => (
                        <div key={ibadah.ibadah_type_id} className="flex items-center space-x-4">
                          <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                            <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{ibadah.name}</div>
                            <div className="text-sm text-gray-500">
                              {ibadah.completedDays}/{ibadah.totalDays} hari
                              {ibadah.tracking_type === 'count' && ibadah.unit && (
                                <span> • Rata-rata: {ibadah.averageCount} {ibadah.unit}</span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    ibadah.completionRate < 30 ? 'bg-red-500' :
                                    ibadah.completionRate < 60 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(ibadah.completionRate, 100)}%` }}
                                />
                              </div>
                              <span className={`text-sm font-medium ${
                                ibadah.completionRate < 30 ? 'text-red-600' :
                                ibadah.completionRate < 60 ? 'text-yellow-600' : 'text-green-600'
                              }`}>
                                {ibadah.completionRate.toFixed(1)}%
                              </span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Target: Tingkatkan konsistensi untuk hasil yang lebih baik
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Monthly Consistency Chart for Yearly Reports */}
          {filterType === 'yearly' && monthlyData.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <ChartBarIcon className="w-5 h-5 text-purple-500" />
                  <h3 className="text-lg font-semibold text-gray-900">Grafik Keistiqomahan Bulanan</h3>
                </div>
                <p className="text-sm text-gray-500">
                  Tren konsistensi ibadah sepanjang tahun {selectedYear}
                </p>
              </CardHeader>
              <CardContent>
                <MonthlyConsistencyChart
                  data={monthlyData}
                  year={parseInt(selectedYear || new Date().getFullYear().toString())}
                />
              </CardContent>
            </Card>
          )}

          {/* Detailed Records */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Detail Record Ibadah</h2>
              <p className="text-sm text-gray-500">
                Data ibadah untuk periode {formatDate(new Date(dateFrom), 'dd MMM yyyy')} - {formatDate(new Date(dateTo), 'dd MMM yyyy')}
              </p>
            </CardHeader>
            <CardContent>
              {reportData.records.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Tidak ada data
                  </h3>
                  <p className="text-gray-500">
                    Tidak ada record ibadah untuk periode yang dipilih
                  </p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {reportData.records.map((record) => {
                    const userIbadahItem = userIbadah.find(ui => ui.ibadah_type_id === record.ibadah_type_id);
                    const isCompleted = userIbadahItem
                      ? (userIbadahItem.ibadah_types.tracking_type === 'checklist'
                          ? record.is_completed
                          : record.count_value >= userIbadahItem.target_count)
                      : false;

                    return (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <div>
                            <div className="font-medium text-gray-900">{record.ibadah_types.name}</div>
                            <div className="text-sm text-gray-500">
                              {formatDate(new Date(record.date), 'dd MMM yyyy')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          {record.ibadah_types.tracking_type === 'checklist' ? (
                            <span className={`text-sm font-medium ${isCompleted ? 'text-green-600' : 'text-gray-500'}`}>
                              {isCompleted ? 'Selesai' : 'Belum selesai'}
                            </span>
                          ) : (
                            <span className="text-sm font-medium text-gray-900">
                              {record.count_value} / {userIbadahItem?.target_count || 1}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Memuat data laporan...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Data State */}
      {!isLoading && !reportData && !error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Pilih filter dan klik "Tampilkan Data"
              </h3>
              <p className="text-gray-500">
                Pilih jenis filter dan rentang tanggal untuk melihat laporan ibadah Anda
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
