'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { ROUTES } from '@/lib/constants';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email tidak valid'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        data.email,
        {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        }
      );

      if (resetError) {
        if (resetError.message.includes('User not found')) {
          setError('Email tidak ditemukan. Pastikan email yang Anda masukkan benar.');
        } else {
          setError(resetError.message);
        }
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
      console.error('Forgot password error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card>
        <CardHeader className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Email Terkirim</h1>
          <p className="text-gray-600 mt-2">
            Kami telah mengirimkan link reset password ke email Anda.
          </p>
        </CardHeader>

        <CardContent>
          <div className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              <p className="text-sm">
                Silakan cek email Anda dan klik link yang diberikan untuk mereset password.
                Jika tidak melihat email, cek folder spam/junk.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href={ROUTES.LOGIN}
                className="block w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-center"
              >
                Kembali ke Login
              </Link>
              
              <button
                onClick={() => {
                  setSuccess(false);
                  setError(null);
                }}
                className="block w-full px-4 py-2 text-emerald-600 hover:text-emerald-700 transition-colors text-center"
              >
                Kirim Ulang Email
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Link
            href={ROUTES.LOGIN}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-auto"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex-1">Lupa Password</h1>
          <div className="w-9"></div> {/* Spacer for centering */}
        </div>
        <p className="text-gray-600">
          Masukkan email Anda untuk menerima link reset password.
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <Input
              {...register('email')}
              type="email"
              id="email"
              placeholder="nama@email.com"
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Mengirim...' : 'Kirim Link Reset'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Ingat password Anda?{' '}
            <Link href={ROUTES.LOGIN} className="text-emerald-600 hover:text-emerald-700 font-medium">
              Kembali ke Login
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
