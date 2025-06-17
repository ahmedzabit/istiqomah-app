'use client';

import { Button } from '@/components/ui/Button';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface DeleteConfirmModalProps {
  ibadah: {
    id: string;
    ibadah_types: {
      id: string;
      name: string;
      is_default: boolean;
      created_by: string | null;
    };
  };
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ ibadah, onClose, onConfirm }: DeleteConfirmModalProps) {
  const isDefaultIbadah = ibadah.ibadah_types.is_default;

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
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Hapus "{ibadah.ibadah_types.name}"?
              </h3>
              
              {isDefaultIbadah ? (
                <div className="space-y-3">
                  <p className="text-gray-600">
                    Ini adalah ibadah default sistem. Menghapus akan:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li>Menonaktifkan ibadah ini dari dashboard Anda</li>
                    <li>Menyimpan semua riwayat tracking yang sudah ada</li>
                    <li>Ibadah dapat diaktifkan kembali kapan saja</li>
                  </ul>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <p className="text-blue-800 text-sm">
                      <strong>Info:</strong> Ibadah default tidak akan dihapus permanen dari sistem.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-gray-600">
                    Ini adalah ibadah custom yang Anda buat. Menghapus akan:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    <li><strong>Menghapus permanen</strong> jenis ibadah ini</li>
                    <li><strong>Menghapus semua riwayat</strong> tracking terkait</li>
                    <li>Data yang dihapus <strong>tidak dapat dikembalikan</strong></li>
                  </ul>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-red-800 text-sm">
                      <strong>Peringatan:</strong> Tindakan ini tidak dapat dibatalkan!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 p-6 border-t bg-gray-50">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDefaultIbadah ? 'Nonaktifkan' : 'Hapus Permanen'}
          </Button>
        </div>
      </div>
    </div>
  );
}
