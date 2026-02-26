/** @type {import('next').NextConfig} */
const nextConfig = {
  // Prisma must be external for Turbopack - prevents "Invalid _TURBOPACK_imported_module" on sign-in
  serverExternalPackages: ['prisma', '@prisma/client'],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.pravatar.cc', pathname: '/**' },
      { protocol: 'https', hostname: 'api.heygen.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
  },

  compress: true,

  // Hide the floating "N" dev indicator in the bottom-left (dev only; never shows in production)
  devIndicators: false,

  // Slight perf: remove X-Powered-By header
  poweredByHeader: false,

  // Faster development builds
  reactStrictMode: false, // Disable strict mode in dev for faster renders

  experimental: {
    serverActions: {
      bodySizeLimit: '150mb',
    },
    // Allow large avatar video uploads (main + consent) in route handlers
    proxyClientMaxBodySize: '150mb',
    // Optimize package imports
    optimizePackageImports: ['lucide-react', '@anthropic-ai/sdk', 'framer-motion', 'recharts'],
  },
  
  // Reduce bundle size
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/dist/esm/icons/{{kebabCase member}}',
    },
  },
  
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  async headers() {
    const list = [
      {
        source: '/api/heygen/avatars',
        headers: [
          { key: 'Cache-Control', value: 'private, s-maxage=3600, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/:path*',
        headers: [{ key: 'X-DNS-Prefetch-Control', value: 'on' }],
      },
    ];
    if (process.env.NODE_ENV === 'development') {
      list.push({
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline'; object-src 'self'; base-uri 'self';",
          },
        ],
      });
    }
    return list;
  },
}

module.exports = nextConfig
