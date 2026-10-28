'use client'

import { useEffect } from 'react'
import { type Locale } from '@/lib/i18n/config'
import { type Dictionary } from '@/lib/i18n/get-dictionary'

interface RedirectToQuizzesProps {
  lang: Locale
  slug: string
  dict: Dictionary
}

interface RedirectDictTexts {
  quizzes?: {
    redirect_fallback?: string
    back_to_quizzes?: string
  }
}

export function RedirectToQuizzes({ lang, slug, dict }: RedirectToQuizzesProps) {
  const texts = dict as unknown as RedirectDictTexts | undefined
  const target = `/${lang}/quizzes/${slug}/`

  useEffect(() => {
    window.location.replace(target)
  }, [target])

  return (
    <div className="container-custom py-16">
      <div className="max-w-xl mx-auto bg-card border rounded-xl p-8 text-center">
        <p className="text-muted-foreground mb-6">
          {texts?.quizzes?.redirect_fallback || 'This quiz has moved: continue to the Quizzes section'}
        </p>
        <a
          href={target}
          className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
        >
          {texts?.quizzes?.back_to_quizzes || 'Back to Quizzes'}
        </a>
      </div>
    </div>
  )
}
