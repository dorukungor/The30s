/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: false,
    domains: ['lh3.googleusercontent.com'], // Google Auth için gerekli
  },
}

module.exports = nextConfig 