#!/usr/bin/env node
// tests/support/static-server.mjs
//
// Zero-dependency static file server that mirrors the GitHub Pages hosting
// contract for this site's `out/` directory, so the integration and E2E tests
// exercise the same URL semantics as production:
//
//   GET /en/courses/            → out/en/courses/index.html          (200)
//   GET /en/courses             → 301 redirect to /en/courses/       (Pages behaviour)
//   GET /anything/unknown/here  → out/404.html with status 404       (Pages behaviour)
//   GET /_next/static/...       → served as a plain file
//
// Why not `npx serve`: `serve` is fetched at run time (unpinned) and its
// cleanUrls / 404 semantics differ from GitHub Pages (it serves directory
// paths without the trailing-slash redirect and uses its own 404 page), which
// makes tests pass against a contract the site is not deployed under.
//
// Usage: node tests/support/static-server.mjs <rootDir> <port> [host]
// Writes "static-server: listening on :<port>" to stdout when ready.

import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(
  process.cwd(),
  process.argv[2] || 'out'
)
const port = Number(process.argv[3] || process.env.PORT || 3000)
const host = process.argv[4] || process.env.HOST || '127.0.0.1'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.wasm': 'application/wasm',
  '.yaml': 'text/yaml; charset=utf-8',
  '.yml': 'text/yaml; charset=utf-8',
}

if (!fs.existsSync(path.join(root, '.'))) {
  console.error(`static-server: root directory not found: ${root}`)
  console.error('static-server: run `npm run build` first')
  process.exit(1)
}

/** Resolve a URL pathname to an absolute file path, or null when unsafe. */
function resolveSafe(urlPathname) {
  let pathname
  try {
    pathname = decodeURIComponent(urlPathname)
  } catch {
    return null
  }
  // Normalise and reject traversal outside the root.
  const resolved = path.resolve(root, '.' + path.posix.normalize(pathname))
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null
  return resolved
}

/** Split an absolute file path into the file that should be served. */
function lookup(filePath) {
  let stat = fs.existsSync(filePath) ? fs.statSync(filePath) : null
  if (stat?.isDirectory()) {
    const index = path.join(filePath, 'index.html')
    if (fs.existsSync(index)) return { file: index, isIndex: true }
    return { file: null, isIndex: false }
  }
  if (stat?.isFile()) return { file: filePath, isIndex: false }
  return { file: null, isIndex: false }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  // The root index.html (a locale-redirect stub written by postbuild) is what
  // GitHub Pages serves at "/", so treat "/" as a file, not a directory list.
  const isRoot = url.pathname === '/'

  // Directory paths without a trailing slash redirect like GitHub Pages:
  // /en/courses → 301 → /en/courses/
  if (!isRoot && !path.posix.extname(url.pathname) && !url.pathname.endsWith('/')) {
    const target = resolveSafe(url.pathname)
    if (target && fs.existsSync(target) && fs.statSync(target).isDirectory()) {
      res.writeHead(301, { Location: url.pathname + '/' + url.search })
      res.end()
      return
    }
  }

  const filePath = resolveSafe(isRoot ? '/index.html' : url.pathname)
  let entry = filePath ? lookup(filePath) : { file: null, isIndex: false }

  // No trailing slash on a directory that has no index → still a 404.
  if (!entry.file) {
    const notFound = path.join(root, '404.html')
    const body = fs.existsSync(notFound)
      ? fs.readFileSync(notFound)
      : '404 Not Found'
    res.writeHead(404, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Length': body.length,
    })
    if (req.method !== 'HEAD') res.end(body)
    else res.end()
    return
  }

  const body = fs.readFileSync(entry.file)
  const type = MIME[path.extname(entry.file).toLowerCase()] || 'application/octet-stream'
  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'Content-Length': body.length,
  })
  if (req.method === 'HEAD') {
    res.end()
  } else {
    res.end(body)
  }
})

server.listen(port, host, () => {
  console.log(`static-server: listening on :${port} (root: ${root})`)
})

process.on('SIGTERM', () => server.close(() => process.exit(0)))
process.on('SIGINT', () => server.close(() => process.exit(0)))
