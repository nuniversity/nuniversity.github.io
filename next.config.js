/** @type {import('next').NextConfig} */

const isProd = process.env.NODE_ENV === 'production'

const repo = (process.env.GITHUB_REPOSITORY || '').split('/')[1] || ''
const isOrgSite = repo.endsWith('.github.io')
const basePath = isProd && repo && !isOrgSite ? '/' + repo : ''

const nextConfig = {
  output: isProd ? 'export' : undefined,
  // Static export cannot ship middleware. Production locale routing lives in
  // public/index.html and the postbuild 404 stub; in development this keeps
  // the bare root usable without resurrecting a production-only middleware.
  redirects: isProd
    ? undefined
    : async () => [{ source: '/', destination: '/en/', permanent: false }],
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  assetPrefix: basePath ? basePath + '/' : undefined,
  basePath: basePath,
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
