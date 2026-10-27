// app/[lang]/page.tsx
import Hero from '@/components/home/Hero'
import SectionMap from '@/components/home/SectionMap'
import FeaturedCourses from '@/components/home/FeaturedCourses'
import Stats from '@/components/home/Stats'
import Tools from '@/components/home/Tools'
// import Newsletter from '@/components/home/Newsletter'
// import Spotlight from '@/components/home/Spotlight'
// import TopicMarquee from '@/components/home/TopicMarquee'
import ContinueLearning from '@/components/home/ContinueLearning'
import { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getAllCourses } from '@/lib/courses/get-course-content'
import { getAllTools } from '@/lib/tools/get-tool-content'
import { getAllGames } from '@/lib/games/get-game-content'
import { getAllResources } from '@/lib/library/get-library-resources'
import type { StatItem } from '@/components/home/Stats'
import { buildAlternates } from '@/lib/seo/alternates'


export async function generateMetadata({
  params }: {
  params: { lang: Locale }
}): Promise<Metadata> {
  const dict = await getDictionary(params.lang)
  
  return {
    alternates: buildAlternates(params.lang, ''),
    title: dict.metadata.home.title,
    description: dict.metadata.home.description,
    openGraph: {
      title: dict.metadata.home.title,
      description: dict.metadata.home.description,
      type: 'website',
      locale: params.lang === 'en' ? 'en_US' : params.lang === 'pt' ? 'pt_BR' : 'es_ES' } }
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')}k+`
  return `${n}+`
}

export default async function HomePage({
  params }: {
  params: { lang: Locale }
}) {
  const dict = await getDictionary(params.lang)
  const [courses, tools, games, resources] = await Promise.all([
    getAllCourses(params.lang),
    getAllTools(params.lang),
    getAllGames(params.lang),
    getAllResources(params.lang),
  ])

  const stats: StatItem[] = [
    { label: dict.stats?.labels?.courses || 'Courses', value: formatCount(courses.length), icon: 'BookOpen' },
    { label: dict.stats?.labels?.tools || 'Tools', value: formatCount(tools.length), icon: 'Wrench' },
    { label: dict.stats?.labels?.games || 'Games', value: formatCount(games.length), icon: 'GamepadIcon' },
    { label: dict.stats?.labels?.resources || 'Resources', value: formatCount(resources.length), icon: 'Library' },
  ]

  return (
    <>
      <Hero lang={params.lang} dict={dict} />
      {/* Personalised surface — floats over the foot of the hero so a
          returning learner can resume immediately. Renders nothing without
          saved progress. */}
      <ContinueLearning lang={params.lang} dict={dict} courses={courses} />
      <SectionMap lang={params.lang} dict={dict} />
      <FeaturedCourses lang={params.lang} dict={dict} courses={courses} />
      <Tools lang={params.lang} dict={dict} tools={tools} />
      <Stats dict={dict} stats={stats} />
      {/* Newsletter is a mock submission with no backend behind it, so it is
          parked until a real delivery service is wired up.
      <Newsletter dict={dict} />
      */}
    </>
  )
}