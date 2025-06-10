'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supportMessageSchema, type SupportMessageFormData } from '@/lib/validations/support';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  BugAntIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabase/client';
import { createSupportMessage, getSupportMessages } from '@/lib/supabase/database';

export default function SupportPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [user, setUser] = useState<any>(null);
  const [ticketHistory, setTicketHistory] = useState<any[]>([]);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupportMessageFormData>({
    resolver: zodResolver(supportMessageSchema),
  });

  const categories = [
    {
      id: 'technical',
      name: 'Masalah Teknis',
      icon: ExclamationTriangleIcon,
      color: 'bg-red-100 text-red-600',
      description: 'Aplikasi error, tidak bisa login, dll'
    },
    {
      id: 'feature',
      name: 'Pertanyaan Fitur',
      icon: QuestionMarkCircleIcon,
      color: 'bg-blue-100 text-blue-600',
      description: 'Cara menggunakan fitur tertentu'
    },
    {
      id: 'suggestion',
      name: 'Saran Perbaikan',
      icon: LightBulbIcon,
      color: 'bg-yellow-100 text-yellow-600',
      description: 'Ide untuk meningkatkan aplikasi'
    },
    {
      id: 'bug',
      name: 'Laporan Bug',
      icon: BugAntIcon,
      color: 'bg-purple-100 text-purple-600',
      description: 'Fitur tidak berfungsi dengan benar'
    },
    {
      id: 'other',
      name: 'Lainnya',
      icon: EllipsisHorizontalIcon,
      color: 'bg-gray-100 text-gray-600',
      description: 'Pertanyaan atau masalah lainnya'
    }
  ];

  // Load user and ticket history
  useState(() => {
    const loadData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          const messages = await getSupportMessages(user.id);
          setTicketHistory(messages);
        }
      } catch (error) {
        console.error('Error loading support data:', error);
      }
    };
    loadData();
  });

  const onSubmit = async (data: SupportMessageFormData) => {
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    setIsLoading(true);

    try {
      await createSupportMessage({
        user_id: user.id,
        subject: data.subject,
        message: data.message,
        category: selectedCategory,
        status: 'open'
      });

      setSuccess(true);
      reset();
      setSelectedCategory('');

      // Reload ticket history
      const messages = await getSupportMessages(user.id);
      setTicketHistory(messages);
    } catch (error: any) {
      console.error('Error sending support message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      open: { label: 'Terbuka', color: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'Diproses', color: 'bg-yellow-100 text-yellow-800' },
      closed: { label: 'Selesai', color: 'bg-green-100 text-green-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Pesan Terkirim!</h1>
            <p className="text-gray-600 mt-2">
              Terima kasih telah menghubungi kami. Tim support akan merespons dalam 1x24 jam.
            </p>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setSuccess(false)}
              className="w-full"
            >
              Kirim Pesan Lain
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
          Pusat Bantuan
        </h1>
        <p className="text-gray-600 mt-1">
          Kami siap membantu Anda. Pilih kategori dan kirim pesan Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Support */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-900">Kirim Pesan</h2>
              <p className="text-sm text-gray-500">
                Jelaskan masalah atau pertanyaan Anda dengan detail
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Kategori *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categories.map((category) => (
                      <label key={category.id} className="relative cursor-pointer">
                        <input
                          type="radio"
                          name="category"
                          value={category.id}
                          checked={selectedCategory === category.id}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="sr-only"
                        />
                        <div className={`p-3 border-2 rounded-lg transition-all ${
                          selectedCategory === category.id
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className="flex items-start space-x-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${category.color}`}>
                              <category.icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 text-sm">
                                {category.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {category.description}
                              </div>
                            </div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subjek *
                  </label>
                  <Input
                    {...register('subject')}
                    id="subject"
                    placeholder="Ringkasan singkat masalah Anda"
                  />
                  {errors.subject && (
                    <p className="text-red-600 text-sm mt-1">{errors.subject.message}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Pesan *
                  </label>
                  <textarea
                    {...register('message')}
                    id="message"
                    rows={6}
                    className="flex w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Jelaskan masalah atau pertanyaan Anda dengan detail..."
                  />
                  {errors.message && (
                    <p className="text-red-600 text-sm mt-1">{errors.message.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !selectedCategory}
                  className="w-full"
                >
                  {isLoading ? 'Mengirim...' : 'Kirim Pesan'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Ticket History */}
        <div>
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Riwayat Tiket</h3>
            </CardHeader>
            <CardContent>
              {ticketHistory.length > 0 ? (
                <div className="space-y-4">
                  {ticketHistory.map((ticket) => (
                    <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">
                          {ticket.subject}
                        </h4>
                        {getStatusBadge(ticket.status)}
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        {new Date(ticket.created_at).toLocaleDateString('id-ID')}
                      </p>
                      {ticket.admin_reply && (
                        <div className="bg-gray-50 rounded p-2 mt-2">
                          <p className="text-xs text-gray-600">
                            <strong>Admin:</strong> {ticket.admin_reply}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    Belum ada riwayat tiket
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* FAQ Quick Links */}
          <Card className="mt-6">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">FAQ</h3>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <h4 className="font-medium text-gray-900 mb-1">
                    Bagaimana cara menambah ibadah baru?
                  </h4>
                  <p className="text-gray-600 text-xs">
                    Klik tombol "Tambah Ibadah" di dashboard atau menu navigasi.
                  </p>
                </div>
                <div className="text-sm">
                  <h4 className="font-medium text-gray-900 mb-1">
                    Bagaimana cara melihat laporan?
                  </h4>
                  <p className="text-gray-600 text-xs">
                    Buka menu "Laporan" untuk melihat progress dan download PDF.
                  </p>
                </div>
                <div className="text-sm">
                  <h4 className="font-medium text-gray-900 mb-1">
                    Kapan fitur Ramadhan aktif?
                  </h4>
                  <p className="text-gray-600 text-xs">
                    Fitur Ramadhan otomatis aktif saat bulan Ramadhan.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
