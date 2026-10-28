// components/layout/Header.tsx
'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import dynamicImport from 'next/dynamic'
import { Menu, X, Sun, Moon, Search, ChevronDown, Info, Mail, Compass, HeartHandshake } from 'lucide-react'
import LanguageSwitcher from '../language/LanguageSwitcher'
import ProfileChip from '../gamification/ProfileChip'
import AwardToaster from '../gamification/AwardToaster'
import { type Locale } from '@/lib/i18n/config'
import { type Dictionary } from '@/lib/i18n/get-dictionary'
import { useTheme } from '@/components/providers/Providers'
import { sections, type SectionId } from '@/lib/navigation/sections'
import { usePathname } from 'next/navigation'

const CommandPalette = dynamicImport(() => import('../search/CommandPalette'), { ssr: false })

interface HeaderProps {
  lang: Locale
  dict: Dictionary
}

interface NavItem {
  id: SectionId
  name: string
  href: string
  /** Overrides the section icon — used by the site pages. */
  icon?: typeof Info
  /**
   * Match the path exactly. Required for the locale root ("/en"), because
   * every page lives under "/en/…" and a prefix match would keep Home
   * highlighted on every route.
   */
  exact?: boolean
}

export default function Header({ lang, dict }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [isMac, setIsMac] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)
  const pathname = usePathname()
  const moreRef = useRef<HTMLDivElement>(null)
  const { theme, ready, toggleTheme } = useTheme()

  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.userAgent))
  }, [])

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setIsMenuOpen(false)
    setIsMoreOpen(false)
  }, [pathname])

  // Escape closes the "More" dropdown; a click outside closes it too.
  useEffect(() => {
    if (!isMoreOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMoreOpen(false)
    }
    const onClick = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setIsMoreOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onClick)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onClick)
    }
  }, [isMoreOpen])

  const primaryNavigation: NavItem[] = [
    { id: 'general', name: dict.navigation.home, href: `/${lang}`, exact: true },
    { id: 'courses', name: dict.navigation.courses, href: `/${lang}/courses` },
  ]

  // Everything that is discovered rather than browsed lives in one panel,
  // so the top bar stays at two items plus Explore.
  const exploreNavigation: NavItem[] = [
    { id: 'tools', name: dict.navigation.tools, href: `/${lang}/tools` },
    { id: 'games', name: dict.navigation.games, href: `/${lang}/games` },
    { id: 'quizzes', name: dict.navigation.quizzes, href: `/${lang}/quizzes` },
    { id: 'library', name: dict.navigation.library || 'Library', href: `/${lang}/library` },
    { id: 'roadmaps', name: dict.navigation.roadmaps || 'Roadmaps', href: `/${lang}/roadmaps` },
    { id: 'languages', name: dict.navigation.languages || 'Languages', href: `/${lang}/languages` },
  ]

  // Site pages live after Explore and use their own icons rather than a
  // section colour.
  const siteNavigation: NavItem[] = [
    { id: 'general', name: dict.navigation.about, href: `/${lang}/about`, icon: Info, exact: true },
    { id: 'general', name: dict.navigation.partners, href: `/${lang}/partners`, icon: HeartHandshake, exact: true },
    { id: 'general', name: dict.navigation.contact, href: `/${lang}/contact`, icon: Mail, exact: true },
  ]

  /**
   * True when the given link points at the section the user is currently in.
   *
   * `exact` links (the locale root, About, Contact) only match their own
   * path. Everything else also matches its descendants.
   */
  const isActive = (item: NavItem) => {
    if (!pathname) return false
    const clean = (p: string) => p.split('?')[0].replace(/\/$/, '')
    const target = clean(item.href)
    const current = clean(pathname)
    if (target === current) return true
    if (item.exact) return false
    return current.startsWith(target + '/')
  }

  return (
    <header
      className={`print:hidden sticky top-0 z-50 w-full border-b border-border/70 backdrop-blur transition-shadow duration-200 ${
        isScrolled
          ? 'bg-background/85 shadow-[0_1px_12px_-2px_rgb(15_23_42/0.12)] supports-[backdrop-filter]:bg-background/70'
          : 'bg-background/95 supports-[backdrop-filter]:bg-background/80'
      }`}
    >
      <nav className="container-custom" aria-label="Main">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href={`/${lang}`} className="group flex items-center gap-2.5 shrink-0">
            <span
              className="flex items-center justify-center w-10 h-10 rounded-xl font-extrabold text-lg tracking-tight text-white shadow-sm ring-1 ring-inset ring-white/20 transition-transform duration-200 group-hover:scale-105 group-hover:shadow-md"
              style={{ backgroundImage: 'var(--brand-mark-gradient)' }}
              aria-hidden="true"
            >
              NU
            </span>
            <span className="font-bold text-lg tracking-tight text-foreground hidden sm:inline-block">
              Nuniversity
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-0.5">
            {primaryNavigation.map((item) => {
              const section = sections[item.id]
              const active = isActive(item)
              const Icon = item.icon ?? section.icon
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-150 ${
                    active
                      ? `${section.text} ${section.soft}`
                      : 'text-foreground-muted hover:bg-surface-sunken hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.name}
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-2 -bottom-[9px] h-0.5 rounded-full bg-current"
                    />
                  )}
                </Link>
              )
            })}
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                aria-expanded={isMoreOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-150 ${
                  isMoreOpen
                    ? 'bg-surface-sunken text-foreground'
                    : 'text-foreground-muted hover:bg-surface-sunken hover:text-foreground'
                }`}
              >
                {dict.navigation.explore || 'Explore'}
                <Compass className="h-4 w-4" aria-hidden="true" />
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {isMoreOpen && (
                <div className="absolute right-0 top-full mt-3 z-50 w-[34rem] overflow-hidden rounded-2xl border border-border bg-popover shadow-xl animate-slide-down">
                  {/* Discoverable sections, shown as colour-coded cards so the
                      site's colour map is legible from the navigation. */}
                  <ul className="grid grid-cols-2 gap-1 p-2">
                    {exploreNavigation.map((item) => {
                      const section = sections[item.id]
                      const active = isActive(item)
                      const Icon = section.icon
                      return (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            aria-current={active ? 'page' : undefined}
                            onClick={() => setIsMoreOpen(false)}
                            className={`flex items-center gap-3 rounded-xl p-3 transition-colors duration-150 ${
                              active
                                ? `${section.text} ${section.soft}`
                                : 'hover:bg-surface-sunken'
                            }`}
                          >
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white ${section.gradient}`}
                              aria-hidden="true"
                            >
                              <Icon className="h-[18px] w-[18px]" />
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-foreground">
                                {item.name}
                              </span>
                              <span className="block truncate text-xs leading-snug text-foreground-muted">
                                {(dict.navigation as Record<string, string>)[`${item.id}_hint`] ||
                                  dict.navigation.explore_hint ||
                                  'Explore'}
                              </span>
                            </span>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Site pages sit after Explore and carry their own icons. */}
            {siteNavigation.map((item) => {
              const active = isActive(item)
              const Icon = item.icon ?? Info
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors duration-150 ${
                    active
                      ? 'text-section-brand bg-section-brand-soft'
                      : 'text-foreground-muted hover:bg-surface-sunken hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-foreground-muted transition-colors duration-150 hover:bg-surface-sunken hover:text-foreground"
              // The icon is swapped by CSS rather than by state, so the server
              // and client always render the same markup. Swapping on `theme`
              // caused both a hydration mismatch and a visible icon "pop".
              aria-label={ready ? (theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme') : 'Toggle theme'}
            >
              <Moon className="h-[18px] w-[18px] dark:hidden" aria-hidden="true" />
              <Sun className="hidden h-[18px] w-[18px] dark:block" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={openSearch}
              aria-label={dict.search.trigger}
              className="flex h-10 items-center gap-2 rounded-lg px-2.5 text-foreground-muted transition-colors duration-150 hover:bg-surface-sunken hover:text-foreground"
              data-testid="search-trigger"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              <kbd className="hidden md:inline-flex h-5 items-center rounded border border-border bg-surface-sunken px-1.5 font-sans text-[11px] font-medium text-foreground-muted">
                {isMac ? '⌘K' : 'Ctrl K'}
              </kbd>
            </button>

            <ProfileChip dict={dict} />
            <LanguageSwitcher currentLocale={lang} />

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg text-foreground-muted transition-colors duration-150 hover:bg-surface-sunken hover:text-foreground"
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-navigation"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Menu className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div
            id="mobile-navigation"
            className="lg:hidden max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-border py-3 animate-slide-down"
          >
            <ul className="grid gap-0.5">
              {[...primaryNavigation, ...exploreNavigation, ...siteNavigation].map((item) => {
                const section = sections[item.id]
                const active = isActive(item)
                const Icon = item.icon ?? section.icon
                const isSitePage = Boolean(item.icon)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-[15px] font-medium transition-colors ${
                        active
                          ? isSitePage
                            ? 'text-section-brand bg-section-brand-soft'
                            : `${section.text} ${section.soft}`
                          : 'text-foreground-muted hover:bg-surface-sunken hover:text-foreground'
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          isSitePage
                            ? 'bg-surface-sunken text-foreground-muted'
                            : `text-white ${item.id === 'general' ? 'bg-brand-mark' : section.gradient}`
                        }`}
                        aria-hidden="true"
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </nav>
      <CommandPalette lang={lang} dict={dict} open={searchOpen} onOpen={openSearch} onClose={closeSearch} />
      <AwardToaster dict={dict} />
    </header>
  )
}
