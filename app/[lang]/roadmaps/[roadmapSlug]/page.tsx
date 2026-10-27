import { getRoadmapContent, getAllRoadmaps } from '@/lib/roadmaps/get-roadmap-content'
import { RoadmapTimeline } from '@/components/roadmaps/RoadmapTimeline'
import { i18n, type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Metadata } from 'next'
import { buildAlternates } from '@/lib/seo/alternates'

export const dynamic = 'force-static'

interface RoadmapViewerPageProps {
  params: {
    lang: Locale
    roadmapSlug: string
  }
}

export async function generateStaticParams() {
  const allParams: { lang: Locale; roadmapSlug: string }[] = []

  for (const locale of i18n.locales) {
    const roadmaps = await getAllRoadmaps(locale)
    for (const roadmap of roadmaps) {
      allParams.push({
        lang: locale,
        roadmapSlug: roadmap.id })
    }
  }

  return allParams
}

export async function generateMetadata({
  params }: {
  params: { lang: Locale; roadmapSlug: string }
}): Promise<Metadata> {
  const roadmap = await getRoadmapContent(params.roadmapSlug, params.lang)

  if (!roadmap) {
    const dict = await getDictionary(params.lang)
    return {
    alternates: buildAlternates(params.lang, `roadmaps/${params.roadmapSlug}`),
    title: dict.roadmaps?.notFound || 'Roadmap Not Found' }
  }

  return {
    alternates: buildAlternates(params.lang, `roadmaps/${params.roadmapSlug}`),
    title: roadmap.title,
    description: roadmap.description || undefined }
}

export default async function RoadmapViewerPage({ params }: RoadmapViewerPageProps) {
  const { lang, roadmapSlug } = params
  const roadmap = await getRoadmapContent(roadmapSlug, lang)
  const dict = await getDictionary(lang)

  if (!roadmap) {
    notFound()
  }

  return (
    <div className="container-custom py-12">
      <div className="mb-6">
        <Link
          href={`/${lang}/roadmaps`}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {dict.roadmaps?.backToRoadmaps || 'Back to Roadmaps'}
        </Link>
      </div>
      <RoadmapTimeline roadmap={roadmap} lang={lang} dict={dict} />
    </div>
  )
}
