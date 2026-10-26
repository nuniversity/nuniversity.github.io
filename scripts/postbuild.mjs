import fs from 'node:fs'
import path from 'node:path'

const OUT = path.join(process.cwd(), 'out')
const ORIGIN = 'https://nuniversity.github.io'
const CANONICAL_RE = /<link rel="canonical" href="[^"]*"\s*\/?>/
// Kept in step with app/[lang]/layout.tsx — verify-csp.mjs checks both.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self' https://formspree.io https://files.rcsb.org",
  "frame-src https://phet.colorado.edu",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://formspree.io",
].join('; ')

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

function routeFromHtml(file) {
  const rel = path.relative(OUT, file).split(path.sep).join('/')
  if (rel === 'index.html') return '/'
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length)
  return '/' + rel.replace(/\.html$/, '/')
}

function fixCanonicals() {
  let replaced = 0
  let inserted = 0
  for (const file of walkHtml(OUT)) {
    const rel = path.relative(OUT, file).split(path.sep).join('/')
    if (rel === 'index.html' || rel === '404.html' || rel === '404/index.html') continue
    const route = routeFromHtml(file)
    const url = ORIGIN + (route.endsWith('/') ? route : route + '/')
    const tag = `<link rel="canonical" href="${url}"/>`
    let html = fs.readFileSync(file, 'utf8')
    if (CANONICAL_RE.test(html)) {
      html = html.replace(CANONICAL_RE, tag)
      replaced++
    } else {
      html = html.replace('</head>', `    ${tag}\n  </head>`)
      inserted++
    }
    fs.writeFileSync(file, html)
  }
  console.log(`canonical: ${replaced} replaced, ${inserted} inserted`)
}

function write404() {
  const stub = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="robots" content="noindex"/>
<meta http-equiv="Content-Security-Policy" content="${CSP}"/>
<meta name="referrer" content="strict-origin-when-cross-origin"/>
<title>404 — NUniversity</title>
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
}

function sitemapFallback() {
  const sm = path.join(OUT, 'sitemap.xml')
  if (fs.existsSync(sm)) {
    console.log('sitemap.xml: present (app/sitemap.ts)')
    return
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

if (!fs.existsSync(OUT)) {
  console.error('postbuild: out/ directory not found — run next build first')
  process.exit(1)
}

fixCanonicals()
write404()
ensureCsp()
sitemapFallback()
console.log('postbuild: done')
