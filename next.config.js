/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production'

const repo = (process.env.GITHUB_REPOSITORY || '').split('/')[1] || ''
const isOrgSite = repo.endsWith('.github.io')
const basePath = isProd && repo && !isOrgSite ? '/' + repo : ''

const nextConfig = {
  output: isProd ? 'export' : undefined,
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  distDir: 'out',
  assetPrefix: basePath ? basePath + '/' : undefined,
  basePath: basePath,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
