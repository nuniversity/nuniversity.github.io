// components/layout/Header.tsx
'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import dynamicImport from 'next/dynamic'
import { Menu, X, Sun, Moon, Search, Library, Github, Twitter, Linkedin, Mail, BookOpen, Code, Calculator, GamepadIcon, Home, Map, Award, Languages, ChevronDown } from 'lucide-react'
import LanguageSwitcher from '../language/LanguageSwitcher'
import ProfileChip from '../gamification/ProfileChip'
import AwardToaster from '../gamification/AwardToaster'
import { type Locale } from '@/lib/i18n/config'
import { type Dictionary } from '@/lib/i18n/get-dictionary'
import { useTheme } from '@/components/providers/Providers'

const CommandPalette = dynamicImport(() => import('../search/CommandPalette'), { ssr: false })


interface HeaderProps {
  lang: Locale
  dict: Dictionary
}


export default function Header({ lang, dict }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [isMac, setIsMac] = useState(true)
  const { theme, toggleTheme } = useTheme()

  const openSearch = useCallback(() => setSearchOpen(true), [])
  const closeSearch = useCallback(() => setSearchOpen(false), [])

  useEffect(() => {
    setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.userAgent))
  }, [])

  const primaryNavigation = [
    { name: dict.navigation.home, href: `/${lang}`, icon: Home, isNew: false },
    { name: dict.navigation.courses, href: `/${lang}/courses`, icon: BookOpen, isNew: false },
    { name: dict.navigation.tools, href: `/${lang}/tools`, icon: Calculator, isNew: true },
    { name: dict.navigation.games, href: `/${lang}/games`, icon: GamepadIcon, isNew: true },
    { name: dict.navigation.quizzes, href: `/${lang}/quizzes`, icon: Award, isNew: true },
    { name: dict.navigation.library || 'Library', href: `/${lang}/library`, icon: Library, isNew: true },
    { name: dict.navigation.roadmaps || 'Roadmaps', href: `/${lang}/roadmaps`, icon: Map, isNew: true },
    { name: dict.navigation.languages || 'Languages', href: `/${lang}/languages`, icon: Languages, isNew: true },
  ]

  const moreNavigation = [
    { name: dict.navigation.about, href: `/${lang}/about`, icon: undefined, isNew: false },
    { name: dict.navigation.contact, href: `/${lang}/contact`, icon: undefined, isNew: false },
  ]

  return (
    <header className="print:hidden sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:bg-gray-900/80">
      <nav className="container-custom">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={`/${lang}`} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
              <span className="text-white font-bold text-xl">NU</span>
            </div>
            <span className="font-bold text-xl hidden sm:inline-block text-gray-800 dark:text-gray-100">
              NUniversity
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {primaryNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="relative px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-accent hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
              >
                {item.icon && <item.icon className="w-4 h-4" />}
                {item.name}
                {item.isNew && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full animate-pulse">
                    NEW
                  </span>
                )}
              </Link>
            ))}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMoreOpen(!isMoreOpen)}
                aria-expanded={isMoreOpen}
                aria-haspopup="true"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-accent hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
              >
                {dict.navigation.more || 'More'}
                <ChevronDown className={`w-4 h-4 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`} />
              </button>
              {isMoreOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsMoreOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 top-full mt-1 w-44 z-50 py-1 bg-card border rounded-lg shadow-lg">
                    {moreNavigation.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsMoreOpen(false)}
                        className="block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-accent hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              ) : (
                <Sun className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              )}
            </button>

            {/* Search */}
            <button
              type="button"
              onClick={openSearch}
              aria-label={dict.search.trigger}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
              data-testid="search-trigger"
            >
              <Search className="h-4 w-4 text-gray-700 dark:text-gray-300" />
              <kbd className="hidden md:inline-flex items-center rounded border border-gray-300 dark:border-gray-600 px-1.5 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                {isMac ? '⌘K' : 'Ctrl K'}
              </kbd>
            </button>

            {/* Language Switcher */}
            <ProfileChip dict={dict} />
            <LanguageSwitcher currentLocale={lang} />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-200 dark:border-gray-700 animate-slide-in">
            {[...primaryNavigation, ...moreNavigation].map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="relative block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-accent hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="flex items-center gap-2">
                  {item.icon && <item.icon className="w-4 h-4" />}
                  {item.name}
                  {item.isNew && (
                    <span className="px-1.5 py-0.5 text-xs font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full">
                      NEW
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </div>
          
        )}
      </nav>
      <CommandPalette lang={lang} dict={dict} open={searchOpen} onOpen={openSearch} onClose={closeSearch} />
      <AwardToaster dict={dict} />
    </header>
  )
}