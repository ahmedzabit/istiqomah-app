import Link from "next/link";
import { APP_NAME, APP_TAGLINE, APP_DESCRIPTION, ROUTES } from "@/lib/constants";
import { CheckCircleIcon, ChartBarIcon, CalendarIcon, UserGroupIcon } from "@heroicons/react/24/outline";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">I</span>
            </div>
            <span className="text-xl font-bold text-gray-900">{APP_NAME}</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href={ROUTES.LOGIN}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Masuk
            </Link>
            <Link
              href={ROUTES.REGISTER}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2"
            >
              Daftar
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            {APP_NAME}
          </h1>
          <p className="text-xl text-emerald-600 font-semibold mb-4">
            {APP_TAGLINE}
          </p>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            {APP_DESCRIPTION}. Tingkatkan kualitas ibadah Anda dengan tracking yang mudah dan laporan yang detail.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href={ROUTES.REGISTER}
              className="inline-flex items-center justify-center rounded-md font-medium transition-colors bg-emerald-600 text-white hover:bg-emerald-700 text-lg px-8 py-3"
            >
              Mulai Sekarang
            </Link>
            <Link
              href={ROUTES.LOGIN}
              className="inline-flex items-center justify-center rounded-md font-medium transition-colors border border-slate-300 bg-white hover:bg-slate-50 hover:text-slate-900 text-lg px-8 py-3"
            >
              Sudah Punya Akun?
            </Link>
          </div>



          {/* Features */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <CheckCircleIcon className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Tracking Harian
              </h3>
              <p className="text-gray-600">
                Lacak ibadah harian seperti salat, dzikir, dan tilawah dengan mudah
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <ChartBarIcon className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Laporan PDF
              </h3>
              <p className="text-gray-600">
                Dapatkan laporan progress ibadah dalam format PDF yang detail
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <CalendarIcon className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Fitur Ramadhan
              </h3>
              <p className="text-gray-600">
                Fitur khusus Ramadhan dengan inspirasi harian dan target khatam
              </p>
            </div>

            <div className="text-center p-6 bg-white rounded-lg shadow-sm">
              <UserGroupIcon className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Support 24/7
              </h3>
              <p className="text-gray-600">
                Tim support siap membantu Anda kapan saja melalui sistem tiket
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">I</span>
              </div>
              <span className="text-xl font-bold">{APP_NAME}</span>
            </div>
            <p className="text-gray-400 mb-4">{APP_TAGLINE}</p>
            <p className="text-gray-500 text-sm">
              © 2024 {APP_NAME}. Semua hak dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
