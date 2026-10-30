import { notFound } from 'next/navigation'
import Link from '@/components/navigation/AppLink'
import { ArrowLeft, ExternalLink, Star } from 'lucide-react'
import type { Metadata } from 'next'
import type { Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import {
  getAllAnalyses,
  getAnalysis,
  getResourceById,
} from '@/lib/library/get-library-resources'
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer'
import { LibraryAnalysisQuiz } from '@/components/library/library-analysis-quiz'

export const dynamic = 'force-static'
export const revalidate = false

interface AnalysisPageProps {
  params: Promise<{ lang: Locale; analysisId: string }>
}

export async function generateStaticParams() {
  const params: Array<{ lang: Locale; analysisId: string }> = []
  for (const lang of ['en', 'pt', 'es'] as const) {
    for (const analysis of await getAllAnalyses(lang)) {
      params.push({ lang, analysisId: analysis.id })
    }
  }
  return params
}

export async function generateMetadata(props: AnalysisPageProps): Promise<Metadata> {
  const params = await props.params;
  const analysis = await getAnalysis(params.analysisId, params.lang)
  if (!analysis) return { title: 'Analysis' }
  return {
    title: analysis.title,
    description: analysis.description,
    alternates: {
      canonical: `/${params.lang}/library/analysis/${analysis.id}/`,
    },
    openGraph: {
      type: 'article',
      title: analysis.title,
      description: analysis.description,
    },
  }
}

export default async function LibraryAnalysisPage(props: AnalysisPageProps) {
  const params = await props.params;
  const { lang, analysisId } = params
  const analysis = await getAnalysis(analysisId, lang)
  if (!analysis) notFound()

  const dict = await getDictionary(lang)
  const meta = analysis.analysis
  const source =
    meta?.resourceId && meta.resourceType
      ? await getResourceById(meta.resourceId, meta.resourceType, lang)
      : null

  return (
    <div className="container-custom py-12">
      <div className="mx-auto max-w-4xl">
        <Link
          href={`/${lang}/library/`}
          className="mb-6 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {dict.library?.back_to_library || 'Back to Library'}
        </Link>

        <header className="mb-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-section-library">
            {dict.library?.resource_types?.analysis || 'Analysis'}
          </p>
          <h1 className="text-3xl font-bold md:text-4xl">{analysis.title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{analysis.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{analysis.author}</span>
            {analysis.platform && <span>· {analysis.platform}</span>}
            {analysis.duration && <span>· {analysis.duration}</span>}
            {typeof analysis.rating === 'number' && (
              <span className="inline-flex items-center gap-1">
                · <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                {analysis.rating}
              </span>
            )}
          </div>
        </header>

        {meta?.summary && (
          <section className="mb-8 rounded-2xl border bg-card p-5">
            <h2 className="mb-2 text-lg font-semibold">{dict.library?.source_resource || 'Source resource'}</h2>
            <p className="text-sm text-muted-foreground">{meta.summary}</p>
            {source && (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                {source.title}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </section>
        )}

        {meta?.takeaways?.length ? (
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-semibold">{dict.library?.key_takeaways || 'Key takeaways'}</h2>
            <ul className="space-y-2">
              {meta.takeaways.map((takeaway) => (
                <li key={takeaway} className="flex gap-2 text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-section-library" aria-hidden="true" />
                  {takeaway}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {meta?.objectives?.length ? (
          <section className="mb-8">
            <h2 className="mb-3 text-xl font-semibold">{dict.library?.learning_objectives || 'Learning objectives'}</h2>
            <ul className="space-y-2">
              {meta.objectives.map((objective) => (
                <li key={objective} className="flex gap-2 text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  {objective}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="prose-measure max-w-none">
          <MarkdownRenderer content={analysis.content ?? ''} lang={lang} dict={dict} pageTitle={analysis.title} />
        </div>

        {meta?.quiz && meta.quiz.length > 0 && (
          <LibraryAnalysisQuiz analysisId={analysis.id} questions={meta.quiz} dict={dict} />
        )}
      </div>
    </div>
  )
}
