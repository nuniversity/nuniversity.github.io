'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Award, Printer } from 'lucide-react'
import { getBest, type QuizBest } from '@/lib/quizzes/storage'
import { CertificateCard } from './CertificateCard'

interface CertQuiz {
  slug: string
  title: string
  passingScore: number
}

interface CertificatesClientProps {
  lang: string
  dict: any
  quizzes: CertQuiz[]
}

function tpl(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return Object.entries(vars).reduce(
    (str, [key, val]) => str.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val)),
    template
  )
}

export function CertificatesClient({ lang, dict, quizzes }: CertificatesClientProps) {
  const [bests, setBests] = useState<Record<string, QuizBest | null> | null>(null)

  useEffect(() => {
    const map: Record<string, QuizBest | null> = {}
    for (const quiz of quizzes) {
      map[quiz.slug] = getBest(quiz.slug)
    }
    setBests(map)
  }, [quizzes])

  const passed = bests
    ? quizzes.filter(quiz => bests[quiz.slug]?.passed === true)
    : []

  return (
    <div className="container-custom py-12">
      <div className="max-w-4xl mx-auto">
        <Link
          href={`/${lang}/quizzes/`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          {dict?.navigation?.quizzes || 'Quizzes'}
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-3">
              <Award className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {dict?.quizzes?.certificates?.title || 'My certificates'}
            </h1>
            <p className="text-muted-foreground">
              {dict?.quizzes?.certificates?.description || 'Certifications earned by passing mock exams'}
            </p>
            {bests && (
              <p className="mt-2 text-sm text-muted-foreground" data-testid="certificates-count">
                {tpl(dict?.quizzes?.certificates?.count || '{n} certificates', { n: passed.length })}
              </p>
            )}
          </div>
          {passed.length > 0 && (
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium hover:bg-accent transition-colors print:hidden"
              data-testid="certificates-print"
            >
              <Printer className="h-4 w-4" />
              {dict?.quizzes?.certificate?.print || 'Print'}
            </button>
          )}
        </div>

        {bests && passed.length === 0 && (
          <div className="border border-dashed rounded-2xl p-10 text-center" data-testid="certificates-empty">
            <p className="text-muted-foreground">
              {dict?.quizzes?.certificates?.empty || 'No certificates yet: pass a mock exam to earn one'}
            </p>
            <Link
              href={`/${lang}/quizzes/`}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              {dict?.navigation?.quizzes || 'Quizzes'}
            </Link>
          </div>
        )}

        {passed.map(quiz => (
          <div key={quiz.slug} data-testid={`certificate-${quiz.slug}`} data-quiz-title={quiz.title}>
            <CertificateCard
              dict={dict}
              slug={quiz.slug}
              score={bests?.[quiz.slug]?.percent ?? 0}
              pass={quiz.passingScore}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
