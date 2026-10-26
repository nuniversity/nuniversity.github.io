'use client'

import { usePathname, useRouter } from 'next/navigation'
import { i18n, type Locale, localeNames, localeFlags } from '@/lib/i18n/config'
import { Languages } from 'lucide-react'
import { useState } from 'react'
import courseLessonAliases from '@/lib/i18n/course-lesson-aliases.json'

function resolveLessonSlug(courseSlug: string, lessonSlug: string, newLocale: string): string | undefined | null {
  const course = (courseLessonAliases as Record<string, Record<string, Record<string, string>>>)[courseSlug]
  if (!course) return undefined
  const prefix = lessonSlug.slice(0, 2)
  const target = course[newLocale]?.[prefix]
  return target ?? null
}

export default function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  const switchLanguage = (newLocale: Locale) => {
    if (!pathname) return
    
    const parts = pathname.split('/').filter(Boolean)
    const segments = (i18n.locales as readonly string[]).includes(parts[0]) ? parts.slice(1) : parts
    if (segments[0] === 'courses' && segments[1] && segments[2]) {
      const courseSlug = segments[1]
      const lessonSlug = segments[2]
      const resolved = resolveLessonSlug(courseSlug, lessonSlug, newLocale)
      if (resolved === null) {
        segments.splice(2)
      } else if (resolved) {
        segments[2] = resolved
      }
    }
    const newPathname = '/' + [newLocale, ...segments].join('/')

    // Persist the locale preference for the root redirect stub.
    // `Secure` is only added over HTTPS so local http previews keep working.
    const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax${secure}`
    router.push(newPathname)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Change language"
      >
        <Languages className="w-5 h-5" />
        <span className="text-sm font-medium">
          {localeFlags[currentLocale]} {localeNames[currentLocale]}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            {i18n.locales.map((locale) => (
              <button
                key={locale}
                onClick={() => switchLanguage(locale)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                  locale === currentLocale ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <span className="text-xl">{localeFlags[locale]}</span>
                <span className="text-sm font-medium">{localeNames[locale]}</span>
                {locale === currentLocale && (
                  <span className="ml-auto text-blue-600 dark:text-blue-400">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}