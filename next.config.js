/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  webpack: (config) => {
    // Force Supabase to use CJS instead of ESM
    config.resolve.alias = {
      ...config.resolve.alias,
      '@supabase/supabase-js': require.resolve('@supabase/supabase-js/dist/main/index.js'),
    }
    return config
  },
}

module.exports = nextConfig

