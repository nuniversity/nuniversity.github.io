/**
 * Lightweight clickjacking guard.
 *
 * The published host (GitHub Pages) ignores `out/_headers`, so host-level
 * `X-Frame-Options` / `frame-ancestors` cannot reach visitors. `frame-ancestors`
 * is also ignored inside a `<meta>` CSP by spec, so the only runtime backstop
 * is this tiny inline script: it breaks out of any top-level frame that embeds
 * Nuniversity pages, or blanks the page with a pointer back to the canonical
 * origin when the browser refuses the top-level navigation.
 *
 * Single source of truth for:
 *   - app/[lang]/layout.tsx           (locale pages, 404 pages)
 *   - scripts/postbuild.mjs           (404 stub, `out/404.html`)
 *   - public/index.html               (root locale redirect)
 *
 * `public/code-sandbox.html` intentionally does *not* include it — it is only
 * ever read inside the code-exercise `<iframe sandbox="allow-scripts">`.
 */
export const FRAME_GUARD_SCRIPT = `(function () {
  try {
    if (window.top !== window.self && window.top.location.href !== window.location.href) {
      window.top.location.replace(window.location.href);
      return;
    }
  } catch (e) {
    // Top window is cross-origin and refuses the top-level navigation.
  }
  if (window.top === window.self) return;
  var blank = function () {
    if (window.top !== window.self) {
      var style = document.createElement('style');
      style.textContent = 'html,body{display:none !important}';
      (document.head || document.documentElement).appendChild(style);
      var banner = document.createElement('div');
      banner.setAttribute('style',
        'position:fixed;left:0;top:0;width:100%;height:100%;background:#0b1120;color:#e2e8f0;' +
        'display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;' +
        'font:16px/1.5 system-ui,-apple-system,sans-serif;z-index:2147483647');
      banner.textContent =
        'This page must be opened directly on nuniversity.github.io (or a documented mirror).';
      (document.body || document.documentElement).appendChild(banner);
    }
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', blank);
  } else {
    blank();
  }
})();`
