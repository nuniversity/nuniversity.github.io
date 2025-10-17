// app/[lang]/courses/page.tsx
export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getAllCourses, getAllLessons } from '@/lib/courses/get-course-content'
import { Metadata } from 'next'
import { CoursesClient } from './courses-client'

interface CoursesPageProps {
  params: { lang: Locale }
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Locale }
}): Promise<Metadata> {
  const dict = await getDictionary(params.lang)
  
  return {
    title: dict.courses?.title || 'Courses',
    description: dict.courses?.subtitle || 'Explore all available learning paths',
  }
}

export default async function CoursesPage({ params }: CoursesPageProps) {
  const { lang } = params
  const dict = await getDictionary(lang)
  
  // Get all courses and lessons at build time
  const allCourses = await getAllCourses(lang)
  const allLessonsData = await getAllLessons(null, lang)

  return (
    <CoursesClient 
      lang={lang}
      courses={allCourses}
      lessonsData={allLessonsData}
      dict={dict}
    />
  )
}