import { getAllCourses } from '@/lib/courses/get-course-content'
import { type Locale, i18n } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import ReviewClient from '@/components/review/ReviewClient'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateStaticParams() {
  const params: { lang: Locale; courseSlug: string }[] = []
  for (const lang of i18n.locales) {
    for (const course of await getAllCourses(lang)) {
      params.push({ lang, courseSlug: course.slug })
    }
  }
  return params
}

export default async function PracticePage({ params }: { params: { lang: Locale; courseSlug: string } }) {
  const dict = await getDictionary(params.lang)
  return (
    <div className="container-custom py-12">
      <h1 className="mb-8 text-3xl font-bold">{dict.review?.mixed_heading || 'Mixed practice'}</h1>
      <div className="max-w-3xl">
        <ReviewClient lang={params.lang} dict={dict} courseSlug={params.courseSlug} />
      </div>
    </div>
  )
}
