'use client'

import { useEffect } from 'react'
import { type Locale } from '@/lib/i18n/config'
import { type Dictionary } from '@/lib/i18n/get-dictionary'

interface RedirectToLanguagesProps {
  lang: Locale
  slug: string
  pair: string | null
  dict: Dictionary
}

interface RedirectDictTexts {
  languages?: {
    redirect_fallback?: string
    back_to_languages?: string
  }
}

export function RedirectToLanguages({ lang, slug, pair, dict }: RedirectToLanguagesProps) {
  const texts = dict as unknown as RedirectDictTexts | undefined
  const target = pair ? `/${lang}/languages/${pair}/${slug}/` : `/${lang}/languages/`

  useEffect(() => {
    window.location.replace(target)
  }, [target])

  return (
    <div className="container-custom py-16">
      <div className="max-w-xl mx-auto bg-card border rounded-xl p-8 text-center">
        <p className="text-muted-foreground mb-6">
          {texts?.languages?.redirect_fallback || 'This activity has moved: continue to the Languages section'}
        </p>
        <a
          href={target}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
        >
          {texts?.languages?.back_to_languages || 'Back to Languages'}
        </a>
      </div>
    </div>
  )
}
