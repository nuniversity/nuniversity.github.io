import { getAllCourses } from '@/lib/courses/get-course-content'
import { type Locale, i18n } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import ReviewClient from '@/components/review/ReviewClient'
import Link from '@/components/navigation/AppLink'
import { ArrowLeft, BookOpen } from 'lucide-react'

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
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{dict.review?.mixed_heading || 'Mixed practice'}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/${params.lang}/courses/${params.courseSlug}/`}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            {dict.courses?.back_to_course || 'Back to course'}
          </Link>
          <Link
            href={`/${params.lang}/courses/`}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
          >
            <BookOpen className="h-4 w-4" />
            {dict.courses?.back_to_courses || 'Back to courses'}
          </Link>
        </div>
      </div>
      <div className="max-w-3xl">
        <ReviewClient lang={params.lang} dict={dict} courseSlug={params.courseSlug} />
      </div>
    </div>
  )
}
