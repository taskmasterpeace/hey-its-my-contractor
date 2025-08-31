/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'supabase.co'],
  },
  transpilePackages: ['@contractor-platform/types'],
};

module.exports = nextConfig;