/**
 * The single source of truth for the Content-Security-Policy.
 *
 * It is imported by:
 *   - `app/[lang]/layout.tsx`  → the `<meta http-equiv>` tag
 *   - `scripts/postbuild.mjs`  → the 404 stub and the `ensureCsp` pass
 *   - `scripts/postbuild.mjs`  → the generated `_headers` file for Cloudflare
 *   - `scripts/verify-csp.mjs` → the build-time assertion
 *
 * Keeping one copy means a new embed host cannot be added to one surface and
 * forgotten in another.
 *
 * Plain `.mjs` rather than `.ts` so the build scripts (which run without a
 * TypeScript step) can import it directly. `tsconfig.json` has `allowJs`, so
 * the TypeScript side imports it with full type inference.
 */

/** Origins the page may load resources from. */
const REMOTE = {
  formspree: 'https://formspree.io',
  rcsbFiles: 'https://files.rcsb.org',
  phet: 'https://phet.colorado.edu',
  // Privacy-preserving YouTube embed.
  youtube: 'https://www.youtube-nocookie.com',
  vimeo: 'https://player.vimeo.com',
}

export const CSP_DIRECTIVES = [
  "default-src 'self'",
  // `'unsafe-inline'` is required because Next.js injects its bootstrap
  // script inline; a hash or nonce needs a per-request header, which the
  // current host cannot serve. `'unsafe-eval'` was dropped after verifying
  // that Mermaid, 3Dmol and Recharts do not need it in production.
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // `https:` is required for library thumbnails served by third parties.
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  // Same-origin chunk workers used by the Regex Tester (ReDoS isolation).
  "worker-src 'self'",
  `connect-src 'self' ${REMOTE.formspree} ${REMOTE.rcsbFiles}`,
  `frame-src 'self' ${REMOTE.phet} ${REMOTE.youtube} ${REMOTE.vimeo}`,
  "object-src 'none'",
  "base-uri 'self'",
  `form-action 'self' ${REMOTE.formspree}`,
  'upgrade-insecure-requests',
]

export const CSP_POLICY = CSP_DIRECTIVES.join('; ')

/** Origins the CSP is expected to permit, used by the verifier. */
export const CSP_REQUIRED_ORIGINS = {
  'connect-src': [REMOTE.formspree, REMOTE.rcsbFiles],
  'frame-src': [REMOTE.phet, REMOTE.youtube, REMOTE.vimeo],
  'form-action': [REMOTE.formspree],
}

/**
 * Response-level CSP (`out/_headers`) — extends the page-level policy with
 * `frame-ancestors`, which cannot be expressed in a `<meta>` tag (the CSP spec
 * ignores it there). Delivered only by hosts that actually parse a `_headers` /
 * response headers file; GitHub Pages relies on the inline frame guard instead.
 */
export const CSP_POLICY_HEADERS = `${CSP_POLICY}; frame-ancestors 'none'`

/**
 * Hosts that parse `_headers`/response headers additionally get
 * `X-Frame-Options: DENY` as a legacy defence-in-depth layer.
 */
export const SECURITY_HEADERS_POLICY = [
  'X-Frame-Options: DENY',
]
