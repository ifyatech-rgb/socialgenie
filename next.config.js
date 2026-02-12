/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hide the floating "N" dev indicator in the bottom-left (dev only; never shows in production)
  devIndicators: false,

  // Slight perf: remove X-Powered-By header
  poweredByHeader: false,

  // Faster development builds
  reactStrictMode: false, // Disable strict mode in dev for faster renders

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
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

  // In development only: allow 'unsafe-eval' so HMR / dev tools don't trigger CSP console errors
  async headers() {
    if (process.env.NODE_ENV !== 'development') return [];
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "script-src 'self' 'unsafe-eval' 'unsafe-inline'; object-src 'self'; base-uri 'self';",
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
