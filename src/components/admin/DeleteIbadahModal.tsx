'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { deleteDefaultIbadahType } from '@/lib/supabase/database';

interface DeleteIbadahModalProps {
  ibadah: {
    id: string;
    name: string;
    userCount?: number;
    recordCount?: number;
    is_default: boolean;
  };
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteIbadahModal({ ibadah, onClose, onConfirm }: DeleteIbadahModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError(null);

      await deleteDefaultIbadahType(ibadah.id);
      onConfirm();
    } catch (err: any) {
      console.error('Error deleting ibadah:', err);
      setError(err.message || 'Gagal menghapus ibadah');
    } finally {
      setLoading(false);
    }
  };

  const hasUsers = ibadah.userCount && ibadah.userCount > 0;
  const hasRecords = ibadah.recordCount && ibadah.recordCount > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Konfirmasi Hapus</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Hapus "{ibadah.name}"?
              </h3>
              
              <div className="space-y-3">
                <p className="text-gray-600">
                  Anda akan menghapus ibadah default ini secara permanen. Tindakan ini akan:
                </p>
                
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li><strong>Menghapus permanen</strong> jenis ibadah ini dari sistem</li>
                  <li><strong>Menghapus semua data user</strong> yang menggunakan ibadah ini ({ibadah.userCount || 0} pengguna)</li>
                  <li><strong>Menghapus semua riwayat tracking</strong> terkait ({ibadah.recordCount || 0} records)</li>
                  <li>Data yang dihapus <strong>tidak dapat dikembalikan</strong></li>
                </ul>

                {hasUsers && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-yellow-800 text-sm">
                      <strong>Peringatan:</strong> {ibadah.userCount} pengguna sedang menggunakan ibadah ini. 
                      Menghapus akan mempengaruhi tracking mereka.
                    </p>
                  </div>
                )}

                {hasRecords && (
                  <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
                    <p className="text-orange-800 text-sm">
                      <strong>Data Tracking:</strong> Terdapat {ibadah.recordCount} record tracking yang akan ikut terhapus.
                    </p>
                  </div>
                )}

                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-red-800 text-sm">
                    <strong>PERHATIAN:</strong> Tindakan ini tidak dapat dibatalkan! 
                    Pastikan Anda benar-benar ingin menghapus ibadah ini.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 p-6 border-t bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? 'Menghapus...' : 'Hapus Permanen'}
          </Button>
        </div>
      </div>
    </div>
  );
}
