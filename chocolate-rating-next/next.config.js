/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  assetPrefix: '/The30s/',
  basePath: '/The30s',
  trailingSlash: true,
}

module.exports = nextConfig 