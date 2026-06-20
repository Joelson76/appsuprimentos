/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Disable static optimization for problematic routes
  output: 'standalone',
}

module.exports = nextConfig
