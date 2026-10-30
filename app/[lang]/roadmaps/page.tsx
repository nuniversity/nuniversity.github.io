import { getAllRoadmaps } from '@/lib/roadmaps/get-roadmap-content'
import { RoadmapsClient } from './roadmaps-client'
import { i18n, type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { Metadata } from 'next'
import { buildAlternates } from '@/lib/seo/alternates'

export const dynamic = 'force-static'

interface RoadmapsPageProps {
  params: Promise<{
    lang: Locale
  }>
}

export async function generateStaticParams() {
  return i18n.locales.map(locale => ({ lang: locale }))
}

export async function generateMetadata(
  props: {
    params: Promise<{ lang: Locale }>
  }
): Promise<Metadata> {
  const params = await props.params;
  const dict = await getDictionary(params.lang)

  return {
    alternates: buildAlternates(params.lang, 'roadmaps'),
    title: dict.roadmaps?.title || 'Roadmaps',
    description: dict.roadmaps?.subtitle || 'Structured learning paths' }
}

export default async function RoadmapsPage(props: RoadmapsPageProps) {
  const params = await props.params;
  const { lang } = params
  const roadmaps = await getAllRoadmaps(lang)
  const dict = await getDictionary(lang)

  return <RoadmapsClient lang={lang} roadmaps={roadmaps} dict={dict} />
}
