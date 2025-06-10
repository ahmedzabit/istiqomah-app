'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { ROUTES } from '@/lib/constants';

function VerifyContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        if (!token_hash || type !== 'email') {
          setError('Link verifikasi tidak valid.');
          setIsLoading(false);
          return;
        }

        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'email',
        });

        if (verifyError) {
          setError('Gagal memverifikasi email. Link mungkin sudah kadaluarsa.');
        } else {
          setIsVerified(true);
          // Redirect to dashboard after 3 seconds
          setTimeout(() => {
            router.push(ROUTES.DASHBOARD);
          }, 3000);
        }
      } catch (err) {
        setError('Terjadi kesalahan saat memverifikasi email.');
        console.error('Verify error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [searchParams, router, supabase.auth]);

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-content text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Memverifikasi Email...
          </h1>
          <p className="text-gray-600">
            Mohon tunggu sebentar.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-header text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Verifikasi Gagal</h1>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
        <div className="card-content">
          <div className="space-y-3">
            <Link href={ROUTES.LOGIN} className="btn-primary w-full text-center">
              Kembali ke Login
            </Link>
            <Link href={ROUTES.REGISTER} className="btn-outline w-full text-center">
              Daftar Ulang
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="card">
        <div className="card-header text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Email Terverifikasi!</h1>
          <p className="text-gray-600 mt-2">
            Selamat! Email Anda telah berhasil diverifikasi. Anda akan diarahkan ke dashboard dalam beberapa detik.
          </p>
        </div>
        <div className="card-content">
          <Link href={ROUTES.DASHBOARD} className="btn-primary w-full text-center">
            Lanjut ke Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="card">
        <div className="card-content text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Memuat...
          </h1>
          <p className="text-gray-600">
            Mohon tunggu sebentar.
          </p>
        </div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
