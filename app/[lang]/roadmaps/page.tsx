import { getAllRoadmaps } from '@/lib/roadmaps/get-roadmap-content'
import { RoadmapsClient } from './roadmaps-client'
import { type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'

export const dynamic = 'force-static'

interface RoadmapsPageProps {
  params: {
    lang: Locale
  }
}

export async function generateStaticParams() {
  const locales: Locale[] = ['en', 'pt']
  return locales.map(locale => ({ lang: locale }))
}

export default async function RoadmapsPage({ params }: RoadmapsPageProps) {
  const { lang } = params
  const roadmaps = await getAllRoadmaps(lang)
  const dict = await getDictionary(lang)

  return <RoadmapsClient lang={lang} roadmaps={roadmaps} dict={dict} />
}
