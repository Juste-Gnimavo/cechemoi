/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker deployment
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'cechemoi.hel1.your-objectstorage.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  reactStrictMode: true,
  // Reduce memory usage during builds
  experimental: {
    // Optimize package imports for better tree-shaking
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts'],
    // Keep pdfkit/fontkit external so their .afm data files load from node_modules at runtime
    serverComponentsExternalPackages: ['pdfkit', 'fontkit'],
    // Force standalone output to include pdfkit data files (AFM fonts)
    outputFileTracingIncludes: {
      '/api/admin/reports/financial/export': [
        './node_modules/pdfkit/js/data/**/*',
      ],
      '/api/admin/orders/**': ['./node_modules/pdfkit/js/data/**/*'],
      '/api/admin/invoices/**': ['./node_modules/pdfkit/js/data/**/*'],
      '/api/admin/custom-orders/**': ['./node_modules/pdfkit/js/data/**/*'],
      '/api/admin/receipts/**': ['./node_modules/pdfkit/js/data/**/*'],
    },
  },
  // Rewrite /uploads/* to API route for serving uploaded files in production
  // Next.js standalone mode doesn't serve dynamically uploaded files from public/
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/uploads/:path*',
      },
    ]
  },
}

module.exports = nextConfig
