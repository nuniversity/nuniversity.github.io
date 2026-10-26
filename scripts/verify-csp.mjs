#!/usr/bin/env node
/**
 * Verifies the Content-Security-Policy that ships with the site.
 *
 * GitHub Pages cannot send custom response headers, so the policy is
 * delivered as a `<meta http-equiv>` tag. This script checks the *built*
 * output rather than the source, so it verifies what a browser will
 * actually enforce.
 *
 * It checks:
 *  1. every page carries the policy;
 *  2. the policy contains the required directives;
 *  3. no inline script or external origin violates it;
 *  4. the origins the app actually calls are permitted.
 */
import fs from 'node:fs'
import path from 'node:path'

const OUT = path.join(process.cwd(), 'out')

if (!fs.existsSync(OUT)) {
  console.error('verify-csp: out/ not found — run `next build` first')
  process.exit(1)
}

/** Directives the policy must declare. */
const REQUIRED = [
  'default-src',
  'script-src',
  'style-src',
  'img-src',
  'font-src',
  'connect-src',
  'frame-src',
  'object-src',
  'base-uri',
  'form-action',
]

/** Origins the application genuinely talks to. */
const REQUIRED_ORIGINS = {
  'connect-src': ['https://formspree.io', 'https://files.rcsb.org'],
  'frame-src': ['https://phet.colorado.edu'],
  'form-action': ['https://formspree.io'],
}

/** External origins allowed to appear in the built HTML. */
const ALLOWED_EXTERNAL_ORIGINS = new Set([
  'https://formspree.io',
  'https://files.rcsb.org',
  'https://phet.colorado.edu',
  'https://www.rcsb.org',
  'https://www.youtube.com',
  'https://www.linkedin.com',
  'https://www.instagram.com',
  'https://github.com',
  'https://twitter.com',
  'https://www.google.com',
  'https://translate.google.com',
  // The canonical origin, referenced by <link rel="canonical">.
  'https://nuniversity.github.io',
  // Video providers reachable through the click-to-load facade.
  'https://www.youtube-nocookie.com',
  'https://player.vimeo.com',
  // Avatars referenced by the team page.
  'https://leandroalveso.github.io',
])

/** React HTML-encodes quotes in attribute values. */
function decodeEntities(value) {
  return value
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

/** The origin the site is served from — always allowed by `'self'`. */
const SITE_ORIGIN = 'https://nuniversity.github.io'

/**
 * True when the policy's directive permits loading from `origin`.
 *
 * CSP allows a whole scheme (`https:`) as well as explicit origins, so the
 * check reads the policy rather than consulting a separate list.
 */
function directiveAllows(policy, directive, origin) {
  const value = policy.match(new RegExp(`(?:^|;)\\s*${directive}\\s+([^;]+)`))?.[1]
  if (!value) return false
  if (value.includes("'self'") && origin === SITE_ORIGIN) return true
  if (/(^|\s)https:(\s|$)/.test(value) && origin.startsWith('https:')) return true
  if (/(^|\s)http:(\s|$)/.test(value) && origin.startsWith('http:')) return true
  return value
    .split(/\s+/)
    .some(token => token.replace(/\/$/, '') === origin)
}

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name)
    if (fs.statSync(full).isDirectory()) {
      if (name === '_next') continue
      walk(full, acc)
    } else if (name.endsWith('.html')) {
      acc.push(full)
    }
  }
  return acc
}

const files = walk(OUT)
if (files.length === 0) {
  console.error('verify-csp: no HTML files found in out/')
  process.exit(1)
}

const problems = []
let checked = 0

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8')
  const rel = path.relative(OUT, file)
  checked += 1

  // 1. The policy must be present.
  //    The policy itself contains single quotes, so the attribute value is
  //    matched with a quote-aware pattern rather than a naive character class.
  const match =
    html.match(/<meta\s+http-equiv=["']Content-Security-Policy["']\s+content="([^"]*)"/i) ||
    html.match(/<meta\s+http-equiv=["']Content-Security-Policy["']\s+content='([^']*)'/i)
  if (!match) {
    problems.push(`${rel}: no Content-Security-Policy meta tag`)
    continue
  }
  const policy = decodeEntities(match[1])

  // 2. Required directives.
  for (const directive of REQUIRED) {
    if (!new RegExp(`(^|;|\\s)${directive}\\s`).test(policy)) {
      problems.push(`${rel}: policy is missing "${directive}"`)
    }
  }

  // 3. Required origins.
  for (const [directive, origins] of Object.entries(REQUIRED_ORIGINS)) {
    const directiveValue = policy.match(new RegExp(`${directive}\\s+([^;]+)`))?.[1] ?? ''
    for (const origin of origins) {
      if (!directiveValue.includes(origin)) {
        problems.push(`${rel}: ${directive} does not permit ${origin}`)
      }
    }
  }

  // 4. Every resource the page *loads* must be permitted by the matching
  //    directive. Outbound `href` links are not a CSP concern, so only
  //    loading attributes are examined — and each is checked against the
  //    policy itself (which may allow a whole scheme, e.g. `img-src https:`).
  const resources = []
  for (const m of html.matchAll(/<(img|iframe|script|source|video|audio)\b[^>]*?\s(?:src|srcset|poster)=["'](https?:\/\/[^"'\s,]+)["']/gi)) {
    const tag = m[1].toLowerCase()
    const directive =
      tag === 'iframe'
        ? 'frame-src'
        : tag === 'script'
          ? 'script-src'
          : tag === 'video' || tag === 'audio' || tag === 'source'
            ? 'media-src'
            : 'img-src'
    resources.push({ directive, url: m[2] })
  }
  for (const m of html.matchAll(/<link\b[^>]*?rel=["']stylesheet["'][^>]*?href=["'](https?:\/\/[^"'\s]+)["']/gi)) {
    resources.push({ directive: 'style-src', url: m[1] })
  }

  for (const { directive, url } of resources) {
    let origin
    try {
      origin = new URL(url).origin
    } catch {
      continue
    }
    if (directiveAllows(policy, directive, origin)) continue
    problems.push(`${rel}: ${directive} does not permit ${origin}`)
  }
}

if (problems.length > 0) {
  console.error(`\nverify-csp: ${problems.length} problem(s) found in ${checked} pages:\n`)
  const seen = new Set()
  for (const problem of problems) {
    if (seen.has(problem)) continue
    seen.add(problem)
    console.error(`  ${problem}`)
  }
  console.error('')
  process.exit(1)
}

console.log(`verify-csp: ${checked} pages carry a valid Content-Security-Policy`)
