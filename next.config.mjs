/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: false
  },
  async redirects() {
    return [
      // Legacy public API paths that were indexed before the API moved under /api.
      // Next.js preserves the original query string, so existing consumers keep working.
      {
        source: '/rates/history',
        destination: '/api/rates/history',
        permanent: true
      },
      {
        source: '/rates/statistics',
        destination: '/api/rates/statistics',
        permanent: true
      }
    ];
  }
};

export default nextConfig;
