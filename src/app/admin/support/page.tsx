'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { 
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  EyeIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';

interface SupportMessage {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'closed';
  category?: string;
  created_at: string;
  updated_at: string;
  admin_reply?: string;
  user_profile?: {
    full_name: string | null;
    email: string;
  };
}

interface SupportStats {
  totalMessages: number;
  openMessages: number;
  inProgressMessages: number;
  closedMessages: number;
  todayMessages: number;
}

export default function AdminSupportPage() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [stats, setStats] = useState<SupportStats>({
    totalMessages: 0,
    openMessages: 0,
    inProgressMessages: 0,
    closedMessages: 0,
    todayMessages: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'in_progress' | 'closed'>('all');
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [isResponding, setIsResponding] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchMessages();
    fetchStats();
  }, [filterStatus]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);

      // First, check if user is authenticated and has admin access
      console.log('Checking user authentication and admin status...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('User not authenticated');
      }

      console.log('User authenticated, checking admin status...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error checking admin status:', profileError);
        // Continue anyway, might be RLS issue
      } else if (!profileData?.is_admin) {
        throw new Error('Access denied: Admin privileges required');
      }

      // Test basic access to support_messages table
      console.log('Testing basic access to support_messages table...');
      const { data: testData, error: testError } = await supabase
        .from('support_messages')
        .select('id, user_id, subject, status, created_at')
        .limit(1);

      if (testError) {
        console.error('Basic table access failed:', {
          message: testError?.message || 'Unknown error',
          code: testError?.code,
          details: testError?.details,
          hint: testError?.hint,
          error: testError
        });

        // If we can't even access the basic table, throw an error
        if (testError.code === '42501') {
          throw new Error('Akses ditolak ke tabel support_messages. Pastikan RLS policy untuk admin sudah dikonfigurasi.');
        } else if (testError.code === '42P01') {
          throw new Error('Tabel support_messages tidak ditemukan. Silakan jalankan migrasi database.');
        } else {
          throw new Error(`Tidak dapat mengakses tabel support_messages: ${testError.message}`);
        }
      }

      console.log('Basic table access successful, proceeding with full query...');

      // Try multiple approaches to get support messages with user data
      let data = null;
      let error = null;

      // Simplified approach: Get support messages and user data separately
      console.log('Fetching support messages without relationships...');

      let query = supabase
        .from('support_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data: messagesData, error: messagesError } = await query;

      if (messagesError) {
        console.error('Error fetching support messages:', messagesError);
        throw new Error(`Gagal memuat pesan support: ${messagesError.message}`);
      }

      console.log('Support messages fetched successfully:', messagesData?.length || 0, 'messages');

      // Get user profiles separately for each message
      const messagesWithProfiles = [];

      if (messagesData && messagesData.length > 0) {
        console.log('Fetching user profiles for messages...');

        for (const message of messagesData) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', message.user_id)
              .single();

            if (profileError) {
              console.warn(`Failed to fetch profile for user ${message.user_id}:`, profileError);
              // Add message without profile data
              messagesWithProfiles.push({
                ...message,
                user_profile: null
              });
            } else {
              // Add message with profile data
              messagesWithProfiles.push({
                ...message,
                user_profile: profileData
              });
            }
          } catch (profileFetchError) {
            console.warn(`Error fetching profile for user ${message.user_id}:`, profileFetchError);
            // Add message without profile data
            messagesWithProfiles.push({
              ...message,
              user_profile: null
            });
          }
        }
      }

      data = messagesWithProfiles;
      error = null;

      if (error) {
        console.error('Detailed error fetching support messages:', {
          message: error?.message || 'Unknown error',
          details: error?.details || 'No details',
          hint: error?.hint || 'No hint',
          code: error?.code || 'No code',
          stack: error?.stack || 'No stack',
          name: error?.name || 'No name',
          error: error
        });

        // Handle specific error cases
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          throw new Error('Akses ditolak. Pastikan RLS policy untuk admin sudah dikonfigurasi.');
        } else if (error.code === '42P01') {
          throw new Error('Tabel support_messages tidak ditemukan. Silakan jalankan migrasi database.');
        } else if (error.message?.includes('relationship') || error.message?.includes('schema cache')) {
          console.warn('Relationship error detected, using fallback data');
          // Don't throw error, use the fallback data
        } else if (error.message?.includes('infinite recursion')) {
          console.warn('RLS recursion detected, using fallback data');
          // Don't throw error, use the fallback data
        } else {
          throw new Error(`Gagal memuat pesan support: ${error?.message || 'Unknown database error'}`);
        }
      }

      setMessages(data || []);
    } catch (error: any) {
      console.error('Error fetching support messages:', {
        message: error?.message || 'Unknown error',
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack,
        name: error?.name,
        error: error
      });

      // Provide user-friendly error message
      let userMessage = 'Gagal memuat pesan support. ';

      if (error?.message?.includes('not authenticated')) {
        userMessage += 'Silakan login kembali.';
      } else if (error?.message?.includes('Admin privileges required')) {
        userMessage += 'Akses admin diperlukan.';
      } else if (error?.message?.includes('RLS policy')) {
        userMessage += 'Konfigurasi database perlu diperbaiki.';
      } else if (error?.message?.includes('tidak ditemukan')) {
        userMessage += 'Tabel database tidak ditemukan.';
      } else {
        userMessage += 'Silakan coba lagi atau hubungi administrator.';
      }

      alert(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get total messages
      const { count: totalMessages } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true });

      // Get open messages
      const { count: openMessages } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      // Get in progress messages
      const { count: inProgressMessages } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'in_progress');

      // Get closed messages
      const { count: closedMessages } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'closed');

      // Get today's messages
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: todayMessages } = await supabase
        .from('support_messages')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      setStats({
        totalMessages: totalMessages || 0,
        openMessages: openMessages || 0,
        inProgressMessages: inProgressMessages || 0,
        closedMessages: closedMessages || 0,
        todayMessages: todayMessages || 0
      });
    } catch (error) {
      console.error('Error fetching support stats:', error);
    }
  };

  const updateMessageStatus = async (messageId: string, status: 'open' | 'in_progress' | 'closed') => {
    try {
      const { error } = await supabase
        .from('support_messages')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;

      fetchMessages();
      fetchStats();
    } catch (error) {
      console.error('Error updating message status:', error);
      alert('Gagal mengubah status pesan. Silakan coba lagi.');
    }
  };

  const sendAdminResponse = async () => {
    if (!selectedMessage || !adminResponse.trim()) return;

    try {
      setIsResponding(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('support_messages')
        .update({
          admin_reply: adminResponse,
          status: 'closed',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedMessage.id);

      if (error) throw error;

      setAdminResponse('');
      setSelectedMessage(null);
      fetchMessages();
      fetchStats();
    } catch (error) {
      console.error('Error sending admin response:', error);
      alert('Gagal mengirim respon. Silakan coba lagi.');
    } finally {
      setIsResponding(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'in_progress':
        return 'bg-blue-500/20 text-blue-400';
      case 'closed':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open':
        return 'Terbuka';
      case 'in_progress':
        return 'Diproses';
      case 'closed':
        return 'Selesai';
      default:
        return status;
    }
  };

  const statCards = [
    {
      title: 'Total Pesan',
      value: stats.totalMessages,
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-blue-500',
      change: `+${stats.todayMessages} hari ini`
    },
    {
      title: 'Terbuka',
      value: stats.openMessages,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      change: 'Perlu ditangani'
    },
    {
      title: 'Diproses',
      value: stats.inProgressMessages,
      icon: ExclamationTriangleIcon,
      color: 'bg-blue-500',
      change: 'Sedang ditangani'
    },
    {
      title: 'Selesai',
      value: stats.closedMessages,
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      change: 'Sudah diselesaikan'
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
            Manajemen Support
          </h1>
          <p className="text-slate-400 mt-1">
            Kelola pesan dan pertanyaan dari pengguna
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

      {/* Filter */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-slate-300">Filter Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Semua Pesan</option>
              <option value="open">Terbuka</option>
              <option value="in_progress">Diproses</option>
              <option value="closed">Selesai</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <h2 className="text-lg font-semibold text-white">Pesan Support</h2>
          <p className="text-sm text-slate-400">
            {messages.length} pesan ditemukan
          </p>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <ChatBubbleLeftRightIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-400">Tidak ada pesan support ditemukan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div key={message.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                        <UserIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">
                          {message.user_profile?.full_name ||
                           message.profiles?.full_name ||
                           `User ${message.user_id?.slice(-4) || 'Unknown'}`}
                        </p>
                        <p className="text-xs text-slate-400">
                          {message.user_profile?.email ||
                           message.profiles?.email ||
                           'Email tidak tersedia'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getStatusColor(message.status)}`}>
                        {getStatusText(message.status)}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <h3 className="text-sm font-medium text-white mb-2">{message.subject}</h3>
                    <p className="text-sm text-slate-300 leading-relaxed">{message.message}</p>
                  </div>

                  {message.admin_reply && (
                    <div className="bg-slate-600/50 rounded-lg p-3 mb-3">
                      <p className="text-xs text-slate-400 mb-1">Respon Admin:</p>
                      <p className="text-sm text-slate-200">{message.admin_reply}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-slate-400">
                      <div className="flex items-center space-x-1">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{formatDate(message.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {message.status !== 'closed' && (
                        <>
                          <button
                            onClick={() => updateMessageStatus(message.id, 'in_progress')}
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-xs font-medium transition-colors"
                          >
                            Proses
                          </button>
                          <button
                            onClick={() => setSelectedMessage(message)}
                            className="px-3 py-1 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-xs font-medium transition-colors"
                          >
                            Balas
                          </button>
                        </>
                      )}
                      {message.status === 'closed' && (
                        <button
                          onClick={() => updateMessageStatus(message.id, 'open')}
                          className="px-3 py-1 bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 rounded-lg text-xs font-medium transition-colors"
                        >
                          Buka Kembali
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Response Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Balas Pesan Support</h3>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {selectedMessage.user_profile?.full_name ||
                       selectedMessage.profiles?.full_name ||
                       `User ${selectedMessage.user_id?.slice(-4) || 'Unknown'}`}
                    </p>
                    <p className="text-xs text-slate-400">
                      {selectedMessage.user_profile?.email ||
                       selectedMessage.profiles?.email ||
                       'Email tidak tersedia'}
                    </p>
                  </div>
                </div>
                <h4 className="text-sm font-medium text-white mb-2">{selectedMessage.subject}</h4>
                <p className="text-sm text-slate-300">{selectedMessage.message}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Respon Admin
                  </label>
                  <textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Tulis respon untuk pengguna..."
                    rows={6}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => setSelectedMessage(null)}
                    className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    onClick={sendAdminResponse}
                    disabled={!adminResponse.trim() || isResponding}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                  >
                    {isResponding ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <PaperAirplaneIcon className="w-4 h-4" />
                    )}
                    <span>{isResponding ? 'Mengirim...' : 'Kirim Respon'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
