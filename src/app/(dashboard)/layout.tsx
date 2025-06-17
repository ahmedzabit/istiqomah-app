'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { APP_NAME, ROUTES } from '@/lib/constants';
import { useRamadhanFeature } from '@/hooks/useRamadhanFeature';
import {
  HomeIcon,
  PlusIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
  FireIcon,
  BookOpenIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { isEnabled: isRamadhanEnabled } = useRamadhanFeature();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Get user profile to check admin status
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin, full_name')
          .eq('id', user.id)
          .single();

        setUserProfile(profile);
      }

      setUser(user);
      setIsLoading(false);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null);
          setUserProfile(null);
          router.push(ROUTES.LOGIN);
        } else {
          setUser(session.user);

          // Get user profile when session changes
          if (session.user) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('is_admin, full_name')
              .eq('id', session.user.id)
              .single();

            setUserProfile(profile);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);



  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push(ROUTES.LOGIN);
  };

  const navigation = [
    { name: 'Dashboard', href: ROUTES.DASHBOARD, icon: HomeIcon },
    { name: 'Tambah Ibadah', href: ROUTES.TAMBAH_IBADAH, icon: PlusIcon },
    { name: 'Record Ibadah', href: ROUTES.RECORD_IBADAH, icon: CalendarIcon },
    { name: 'Muhasabah', href: ROUTES.MUHASABAH, icon: FireIcon },
    ...(isRamadhanEnabled ? [{ name: 'Ramadhan', href: ROUTES.RAMADHAN, icon: BookOpenIcon }] : []),
    { name: 'Laporan', href: ROUTES.LAPORAN, icon: DocumentTextIcon },
    { name: 'Support', href: ROUTES.SUPPORT, icon: ChatBubbleLeftRightIcon },
    { name: 'Profil', href: ROUTES.PROFIL, icon: UserIcon },
    ...(userProfile?.is_admin ? [{ name: 'Admin Portal', href: ROUTES.ADMIN_DASHBOARD, icon: ShieldCheckIcon }] : []),
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-white shadow-md"
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="w-6 h-6" />
          ) : (
            <Bars3Icon className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">I</span>
              </div>
              <span className="text-xl font-bold text-gray-900">{APP_NAME}</span>
            </div>
            {user && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-900">
                  {userProfile?.full_name || user.user_metadata?.full_name || user.email}
                </p>
                <p className="text-xs text-gray-500">
                  {user.email}
                  {userProfile?.is_admin && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      Admin
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4 mr-2" />
              Keluar
            </button>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="min-h-screen p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
