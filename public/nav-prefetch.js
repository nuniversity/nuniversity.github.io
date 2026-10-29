/*
 * Intent-based page prefetch.
 *
 * `next build` with `output: 'export'` writes an RSC `.txt` payload per route
 * and prefetches it for client-side navigation. Those payloads are pruned from
 * the artifact to keep the deploy under the GitHub Pages size cap (see
 * `scripts/postbuild.mjs`), so links now perform a normal document navigation.
 *
 * To keep navigation feeling fast, this script prefetches the *HTML document*
 * of a link when the visitor signals intent — hovering it with a pointer or
 * focusing it with the keyboard. The browser stores the response, so the click
 * that follows is served from cache instead of round-tripping the CDN.
 *
 * Deliberately conservative:
 *   - same-origin, http(s), GET navigations only;
 *   - never the current URL, downloads, `rel=external` or `rel=nofollow`;
 *   - disabled on Save-Data and 2G connections;
 *   - capped per page so a hover-happy visitor cannot trigger a download spree.
 */
(function () {
  var MAX_PREFETCHES = 10
  var seen = new Set()
  var issued = 0

  var connection = navigator.connection
  if (connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || ''))) {
    return
  }

  function targetUrl(anchor) {
    if (!anchor) return null
    if (anchor.target && anchor.target !== '_self') return null
    if (anchor.hasAttribute('download')) return null

    var rel = (anchor.getAttribute('rel') || '').toLowerCase()
    if (rel.indexOf('external') !== -1 || rel.indexOf('nofollow') !== -1) return null

    var url
    try {
      url = new URL(anchor.href, location.href)
    } catch (error) {
      return null
    }

    if (url.origin !== location.origin) return null
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    // Same document (hash-only link): the browser needs no network request.
    if (url.pathname === location.pathname && url.search === location.search) return null

    return url.href
  }

  function prefetch(anchor) {
    if (issued >= MAX_PREFETCHES) return

    var href = targetUrl(anchor)
    if (!href || seen.has(href)) return

    seen.add(href)
    issued += 1

    var hint = document.createElement('link')
    hint.rel = 'prefetch'
    hint.as = 'document'
    hint.href = href
    // If the browser declines the hint, release the slot for another URL.
    hint.addEventListener('error', function () {
      issued -= 1
      seen.delete(href)
      hint.remove()
    })
    document.head.appendChild(hint)
  }

  function onIntent(event) {
    var node = event.target
    var anchor = node && node.closest ? node.closest('a[href]') : null
    if (anchor) prefetch(anchor)
  }

  document.addEventListener('pointerover', onIntent, { passive: true })
  document.addEventListener('focusin', onIntent, { passive: true })
})()
