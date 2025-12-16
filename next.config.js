/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [],
  },
  eslint: {
    // Disable ESLint during builds to avoid missing rule errors
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
