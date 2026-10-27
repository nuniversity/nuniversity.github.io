/**
 * Theme initialisation.
 *
 * The theme class must be on `<html>` **before the first paint**, otherwise a
 * dark-mode visitor sees a white page for as long as it takes the JavaScript
 * to hydrate. That is what this inline script is for: it runs in `<head>`,
 * synchronously, before any content is painted.
 *
 * It is a constant string, rendered with `dangerouslySetInnerHTML`, and is
 * permitted by the site's CSP through `script-src 'unsafe-inline'`.
 */

export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'theme'

/** Runs before first paint. Kept tiny and dependency-free. */
export const THEME_INIT_SCRIPT = `(function(){try{
var k=${JSON.stringify(THEME_STORAGE_KEY)};
var stored=localStorage.getItem(k);
var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;
var dark=stored==='dark'||(stored!=='light'&&prefersDark);
var root=document.documentElement;
root.classList.toggle('dark',dark);
root.setAttribute('data-theme',dark?'dark':'light');
root.style.colorScheme=dark?'dark':'light';
}catch(e){}})();`

/**
 * Reads the theme that the init script already applied to `<html>`.
 * Returns `null` during server rendering.
 */
export function readAppliedTheme(): Theme | null {
  if (typeof document === 'undefined') return null
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

/** Validates a raw stored value. */
export function parseStoredTheme(raw: string | null): Theme | null {
  return raw === 'dark' || raw === 'light' ? raw : null
}

/** Applies a theme to the document. */
export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.setAttribute('data-theme', theme)
  root.style.colorScheme = theme
}
