import { getRoadmapContent, getAllRoadmaps } from '@/lib/roadmaps/get-roadmap-content'
import { RoadmapTimeline } from '@/components/roadmaps/RoadmapTimeline'
import { type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-static'

interface RoadmapViewerPageProps {
  params: {
    lang: Locale
    roadmapSlug: string
  }
}

export async function generateStaticParams() {
  const locales: Locale[] = ['en', 'pt']
  const allParams: { lang: Locale; roadmapSlug: string }[] = []

  for (const locale of locales) {
    const roadmaps = await getAllRoadmaps(locale)
    for (const roadmap of roadmaps) {
      allParams.push({
        lang: locale,
        roadmapSlug: roadmap.id,
      })
    }
  }

  return allParams
}

export default async function RoadmapViewerPage({ params }: RoadmapViewerPageProps) {
  const { lang, roadmapSlug } = params
  const roadmap = await getRoadmapContent(roadmapSlug, lang)
  const dict = await getDictionary(lang)

  if (!roadmap) {
    return (
      <div className="container-custom py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Roadmap Not Found</h1>
          <p className="text-muted-foreground mb-6">The roadmap you're looking for doesn't exist.</p>
          <Link
            href={`/${lang}/roadmaps`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Roadmaps
          </Link>
        </div>
      </div>
    )
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
