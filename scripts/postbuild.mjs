import fs from 'node:fs'
import path from 'node:path'
import { CSP_POLICY as CSP } from '../lib/security/csp.mjs'

const OUT = path.join(process.cwd(), 'out')
const ORIGIN = 'https://nuniversity.github.io'

function walkHtml(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    if (fs.statSync(p).isDirectory()) {
      if (name === '_next') continue
      walkHtml(p, acc)
    } else if (name.endsWith('.html')) {
      acc.push(p)
    }
  }
  return acc
}

function write404() {
  const stub = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="robots" content="noindex"/>
<meta http-equiv="Content-Security-Policy" content="${CSP}"/>
<meta name="referrer" content="strict-origin-when-cross-origin"/>
<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48"/>
<link rel="icon" href="/icon.svg" type="image/svg+xml"/>
<link rel="apple-touch-icon" href="/apple-icon.png"/>
<title>404 — Nuniversity</title>
<script>
(function () {
  var m = location.pathname.match(/^\\/(en|pt|es)(\\/|$)/)
  var c = document.cookie.match(/NEXT_LOCALE=(en|pt|es)/)
  var n = (navigator.language || 'en').slice(0, 2)
  var locale = (m && m[1]) || (c && c[1]) || (n === 'pt' ? 'pt' : n === 'es' ? 'es' : 'en')
  location.replace('/' + locale + '/404/?p=' + encodeURIComponent(location.pathname + location.search))
})()
</script>
<noscript><meta http-equiv="refresh" content="0; url=/en/"/></noscript>
</head>
<body>
<noscript><p><a href="/en/">English</a> · <a href="/pt/">Português</a> · <a href="/es/">Español</a></p></noscript>
</body>
</html>
`
  fs.writeFileSync(path.join(OUT, '404.html'), stub)
  console.log('404.html: locale stub written')

  // GitHub Pages only skips Jekyll when this marker is present. The Actions
  // artifact deploy does not run Jekyll, but the marker keeps the export
  // usable if it is ever served straight from a directory/branch, where
  // `_next/` would otherwise be dropped.
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '')
}

function sitemapFallback() {
  const sm = path.join(OUT, 'sitemap.xml')
  if (fs.existsSync(sm)) {
    console.log('sitemap.xml: present (app/sitemap.ts)')
    return
  }
  // Derive a route from an emitted HTML file: `en/courses/index.html` → `/en/courses/`.
  const routeFromHtml = file => {
    const rel = path.relative(OUT, file).split(path.sep).join('/')
    if (rel === 'index.html') return '/'
    if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length)
    return '/' + rel.replace(/\.html$/, '/')
  }
  const urls = walkHtml(OUT)
    .map(routeFromHtml)
    .filter((r) => r !== '/' && r !== '/404/' && !/^\/(en|pt|es)\/404\/$/.test(r))
    .map((r) => (r.endsWith('/') ? r : r + '/'))
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort()
  const body = urls.map((u) => `  <url><loc>${ORIGIN}${u}</loc></url>`).join('\n')
  fs.writeFileSync(
    sm,
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  )
  console.log(`sitemap: fallback generated with ${urls.length} urls`)
}

/**
 * Ensures every emitted HTML file carries the Content-Security-Policy.
 *
 * The pages rendered by Next already carry it (it comes from the root
 * layout), but Next's own root 404 does not — and GitHub Pages can serve
 * that file. This makes the guarantee universal.
 */
function ensureCsp() {
  let patched = 0
  for (const file of walkHtml(OUT)) {
    if (file.endsWith('404.html')) continue // written by write404()
    const html = fs.readFileSync(file, 'utf8')
    if (/http-equiv=["']Content-Security-Policy["']/i.test(html)) continue
    const meta = `<meta http-equiv="Content-Security-Policy" content="${CSP}"/>`
    const next = html.includes('</head>')
      ? html.replace('</head>', `  ${meta}\n</head>`)
      : html.replace(/<meta charset=/, `${meta}\n<meta charset=`)
    fs.writeFileSync(file, next)
    patched += 1
  }
  console.log(`csp: ${patched} page(s) patched`)
}

/**
 * Ensures every exported page advertises the Nuniversity icon.
 *
 * Next's file-convention metadata covers pages rendered through the locale
 * layout, but the root not-found route is emitted without it. Injecting the
 * links here keeps the browser tab consistent on every page (the standalone
 * code sandbox is deliberately stricter and is skipped).
 */
const ICON_LINKS = [
  '<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48"/>',
  '<link rel="icon" href="/icon.svg" type="image/svg+xml"/>',
  '<link rel="apple-touch-icon" href="/apple-icon.png"/>',
].join('\n')

function ensureIcons() {
  let patched = 0
  for (const file of walkHtml(OUT)) {
    if (file.endsWith('code-sandbox.html')) continue
    const html = fs.readFileSync(file, 'utf8')
    if (/rel=["'](?:icon|apple-touch-icon)["']/i.test(html)) continue
    const next = html.includes('</head>')
      ? html.replace('</head>', `  ${ICON_LINKS}\n</head>`)
      : html
    fs.writeFileSync(file, next)
    patched += 1
  }
  console.log(`icons: ${patched} page(s) patched`)
}

/**
 * Writes the Cloudflare Pages `_headers` file.
 *
 * Parsed by Cloudflare Pages at deploy time and applied to every static asset
 * response. That host unlocks the directives a `<meta>` tag cannot carry
 * (frame-ancestors, HSTS, Permissions-Policy).
 */
function writeHeaders() {
  const content = `# Generated by scripts/postbuild.mjs from lib/security/csp.mjs.
# Do not edit by hand — change the policy there.
#
# Parsed by Cloudflare Pages at deploy time and applied to every static asset
# response.

/*
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=()
  Cross-Origin-Opener-Policy: same-origin
  Content-Security-Policy: ${CSP}

/_next/static/*
  Cache-Control: public, max-age=31536000, immutable

/media/*
  Cache-Control: public, max-age=86400

/search-index/*
  Cache-Control: public, max-age=86400

/*.html
  Cache-Control: public, max-age=0, must-revalidate
`
  fs.writeFileSync(path.join(OUT, '_headers'), content)
  console.log('_headers: written for Cloudflare Pages')
}

/**
 * Removes the App Router RSC payloads that `next build` writes next to every
 * page (`…/index.txt`).
 *
 * With `output: 'export'`, Next serialises the React Server Component flight
 * data twice: once inline in the page's HTML (that copy is required for
 * hydration) and once as a sibling `.txt` file used only for client-side
 * navigations. On this site the second copy is ~330 MB — a third of the
 * deploy — and it is what pushed `out/` over the GitHub Pages 1 GB ceiling.
 *
 * Hydration and first paint are unaffected. Internal links render as plain
 * anchors (`components/navigation/AppLink.tsx`), so a click goes straight to
 * the HTML instead of first requesting a payload that no longer exists.
 * `public/nav-prefetch.js` warms that HTML on hover/focus so the document
 * navigation is served from cache. If a Next router navigation does happen,
 * Next strips `.txt` from the response URL and falls back to a document
 * navigation.
 *
 * `robots.txt` and `ads.txt` are real files, not RSC payloads, so they stay.
 */
const KEEP_TXT = new Set(['robots.txt', 'ads.txt'])

function pruneRscPayloads() {
  let removed = 0
  let bytes = 0
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
        continue
      }
      if (!entry.name.endsWith('.txt') || KEEP_TXT.has(entry.name)) continue
      bytes += fs.statSync(full).size
      fs.unlinkSync(full)
      removed += 1
    }
  }
  walk(OUT)
  console.log(
    `prune: removed ${removed} RSC payload(s), ${(bytes / 1024 / 1024).toFixed(1)} MB freed`
  )
}

if (!fs.existsSync(OUT)) {
  console.error('postbuild: out/ directory not found — run next build first')
  process.exit(1)
}

// Canonical URLs and hreflang are now emitted by each page's `generateMetadata`
// (see lib/seo/alternates.ts), so the old HTML-rewriting pass is gone.
write404()
ensureCsp()
ensureIcons()
writeHeaders()
sitemapFallback()
pruneRscPayloads()
console.log('postbuild: done')
