/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:4000'
  },
  images: {
    domains: ['img.youtube.com', 'i.ytimg.com']
  }
}

module.exports = nextConfig
