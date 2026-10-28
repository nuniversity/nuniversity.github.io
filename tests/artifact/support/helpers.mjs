// tests/artifact/support/helpers.mjs
//
// Shared helpers for the artifact integration suites. These treat `out/` as
// the system under test and encode the GitHub Pages hosting contract:
//   /en/courses/         → out/en/courses/index.html
//   /en/courses          → 301 (redirect, never a direct 200)
//   /en/does-not-exist/  → out/404.html with HTTP 404
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
)
export const OUT = path.join(ROOT, 'out')
// The suites are skipped (with a clear message) when no build exists.
export const OUT_READY = fs.existsSync(path.join(OUT, 'en', 'index.html'))
export const ORIGIN = 'https://nuniversity.github.io'
export const LOCALES = ['en', 'pt', 'es']

export function exists(rel) {
  return fs.existsSync(path.join(OUT, rel))
}

export function read(rel) {
  return fs.readFileSync(path.join(OUT, rel), 'utf8')
}

/** Recursively list files under `dir` (absolute paths). */
export function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, acc)
    else acc.push(full)
  }
  return acc
}

/** All emitted HTML files (absolute paths), excluding the _next runtime. */
export function htmlFiles() {
  return walk(OUT).filter(
    (f) =>
      f.endsWith('.html') &&
      !f.split(path.sep).includes('_next')
  )
}

/** Absolute file path → the public route it was emitted for. */
export function routeFor(absFile) {
  const rel = path.relative(OUT, absFile).split(path.sep).join('/')
  if (rel === 'index.html') return '/'
  if (rel === '404.html') return '/404.html'
  return '/' + rel.replace(/\/index\.html$/, '/').replace(/\.html$/, '.html')
}

/**
 * Resolve a public URL (same-origin or relative) to the out/-relative file
 * GitHub Pages would serve. Returns null for unresolvable/external URLs.
 * Encodes the hosting contract: directory paths resolve to index.html,
 * non-trailing-slash paths to a directory are NOT served directly (Pages
 * redirects them), files resolve as-is, queries/hashes ignored.
 */
export function urlToOutFile(url, fromRoute = '/') {
  if (!url) return null
  // Same-origin absolute URLs (sitemap <loc>s) are internal — strip first.
  let candidate = url
  if (candidate.startsWith(ORIGIN)) candidate = candidate.slice(ORIGIN.length) || '/'
  // External, protocol-relative, anchors, and special schemes are out of scope.
  if (/^(https?:)?\/\//i.test(candidate)) return null
  if (/^(mailto:|tel:|javascript:|data:|blob:|sms:|#)/i.test(candidate)) return null

  let pathname = candidate.split('#')[0].split('?')[0]
  // Same-origin absolute URLs (sitemap <loc>s) are internal.
  if (pathname.startsWith(ORIGIN)) pathname = pathname.slice(ORIGIN.length) || '/'
  if (!pathname.startsWith('/')) {
    // Relative href: resolve against the containing route directory.
    const baseDir = fromRoute.endsWith('/')
      ? fromRoute
      : fromRoute.replace(/[^/]*$/, '')
    pathname = path.posix.normalize(baseDir + pathname)
  }
  try {
    pathname = decodeURIComponent(pathname)
  } catch {
    return null
  }
  if (pathname === '/' || pathname === '') return 'index.html'

  const withIndex = pathname.endsWith('/') ? pathname + 'index.html' : null
  // Exact file (e.g. /search-index/en.json, /media/x.webp).
  const asFile = pathname.replace(/^\//, '')
  if (withIndex) return exists(withIndex) ? withIndex : null
  // A path without trailing slash that is a directory is a Pages redirect,
  // not a resolvable page — report it so the link-graph test can flag it.
  if (exists(path.join(OUT, asFile)) && fs.statSync(path.join(OUT, asFile)).isDirectory()) {
    return exists(asFile + '/index.html') ? asFile + '/index.html' : 'REDIRECTABLE:' + asFile + '/'
  }
  return exists(asFile) ? asFile : null
}

/** Extract attribute values like href/src from raw HTML (no DOM parser needed). */
export function extractAttrs(html, attr) {
  const re = new RegExp(`\\s${attr}\\s*=\\s*"([^"]*)"`, 'gi')
  const out = []
  let m
  while ((m = re.exec(html))) out.push(m[1])
  return out
}
