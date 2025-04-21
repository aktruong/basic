/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '14.225.255.182',
        port: '3000',
        pathname: '/assets/**',
      },
    ],
    domains: ['14.225.255.182'],
  },
}

module.exports = nextConfig 