/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during build for deployment
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript errors during build for deployment
  typescript: {
    ignoreBuildErrors: true,
  },

  // Image optimization settings
  images: {
    domains: ['ogxciarfjvtjyxjsndin.supabase.co'],
    unoptimized: true, // Required for static export
  },
};

module.exports = nextConfig;
