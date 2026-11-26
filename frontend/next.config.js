/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['encrypted-tbn0.gstatic.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://texaflow-old-testing.onrender.com/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig;

