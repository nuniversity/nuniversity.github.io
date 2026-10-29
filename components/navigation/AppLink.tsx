import NextLink from 'next/link'
import type { ComponentPropsWithoutRef } from 'react'

type Props = Omit<ComponentPropsWithoutRef<'a'>, 'href'> & {
  href: string
  prefetch?: boolean
  replace?: boolean
  scroll?: boolean
  locale?: string | false
}

/** Anything with a scheme (`https:`, `mailto:`, `tel:`…), `//host`, or `#frag`. */
const NON_PATH = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i

/**
 * Applies the site's `trailingSlash: true` contract to a link.
 *
 * Next's `<Link>` does this for us; the plain anchor this component renders
 * for local navigation must do it too, otherwise every link authored without
 * a slash pays a 301/308 redirect on the host.
 */
function documentHref(href: string): string {
  if (NON_PATH.test(href)) return href

  const hashAt = href.indexOf('#')
  const hash = hashAt === -1 ? '' : href.slice(hashAt)
  const beforeHash = hashAt === -1 ? href : href.slice(0, hashAt)
  const queryAt = beforeHash.indexOf('?')
  const query = queryAt === -1 ? '' : beforeHash.slice(queryAt)
  const path = queryAt === -1 ? beforeHash : beforeHash.slice(0, queryAt)

  if (!path || path.endsWith('/')) return href

  const lastSegment = path.slice(path.lastIndexOf('/') + 1)
  if (lastSegment.includes('.')) return href // asset path, not a route

  return `${path}/${query}${hash}`
}

/**
 * Internal navigation link.
 *
 * This build prunes the per-route RSC `.txt` payloads that Next's client
 * router fetches (see `scripts/postbuild.mjs`) to stay within the hosting
 * size cap. Keeping `next/link` would make every click wait for a doomed RSC
 * request before falling back to a document navigation, so the default here
 * is a plain `<a>`: the browser goes straight to the HTML that
 * `public/nav-prefetch.js` has already warmed on hover/focus.
 *
 * Pass `prefetch` to opt back into Next's client-side router. Links with
 * `replace`/`scroll`/`locale` also use it, since those are router features
 * an anchor cannot reproduce.
 *
 * Assumes the site is served from the domain root (no `basePath`).
 */
export default function AppLink({ href, prefetch, replace, scroll, locale, ...props }: Props) {
  if (prefetch || replace || scroll === false || locale) {
    return (
      <NextLink
        href={href}
        prefetch={prefetch}
        replace={replace}
        scroll={scroll}
        locale={locale}
        {...props}
      />
    )
  }

  return <a href={documentHref(href)} {...props} />
}
