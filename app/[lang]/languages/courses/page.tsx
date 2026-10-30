export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getAllLanguageCourses } from '@/lib/language-courses/get-language-course'
import { pairChipLabel } from '@/lib/languages/format'
import { PairFlags } from '@/components/languages/pair-flags'
import { Metadata } from 'next'
import Link from '@/components/navigation/AppLink'
import { ArrowRight, Languages } from 'lucide-react'
import { buildAlternates } from '@/lib/seo/alternates'

interface LanguageCoursesPageProps {
  params: Promise<{ lang: Locale }>
}

export async function generateMetadata(
  props: {
    params: Promise<{ lang: Locale }>
  }
): Promise<Metadata> {
  const params = await props.params;
  const dict = await getDictionary(params.lang)
  const t = dict.languageCourse
  return {
    alternates: buildAlternates(params.lang, 'languages/courses'),
    title: t?.title || 'Language courses',
    description: t?.subtitle || 'Learn a language by doing: listen, read, write and speak.',
  }
}

export default async function LanguageCoursesPage(props: LanguageCoursesPageProps) {
  const params = await props.params;
  const { lang } = params
  const courses = getAllLanguageCourses(lang)
  const t = (name: string, fallback: string) => (coursesNames[lang]?.[name] ?? fallback)

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-bold mb-2">{t('title', 'Language courses')}</h1>
      <p className="text-muted-foreground mb-8">{t('subtitle', 'Learn a language by doing.')}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => (
          <Link
            key={course.id}
            href={`/${lang}/languages/courses/${course.id}/`}
            className="group rounded-2xl border bg-card p-6 transition-colors hover:border-primary/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{course.emoji || <Languages className="h-6 w-6" />}</span>
              <PairFlags
                source={course.source}
                target={course.target}
                size={16}
              />
              <span className="rounded-lg bg-muted px-2 py-1 text-xs font-semibold">{course.cefrTarget}</span>
            </div>
            <h2 className="text-lg font-semibold group-hover:text-primary transition-colors">
              {course.name[lang] || course.name.en}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {course.description[lang] || course.description.en}
            </p>
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {course.unitCount} {t('units', 'Units')} · {course.lessonCount} {t('lessons', 'Lessons')}
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-primary">
                {t('open', 'Open course')}
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

const coursesNames: Record<string, Record<string, string>> = {
  en: { title: 'Language courses', subtitle: 'Learn a language by doing: listen, read, write and speak.', open: 'Open course', units: 'Units', lessons: 'Lessons' },
  pt: { title: 'Cursos de idiomas', subtitle: 'Aprenda um idioma praticando: ouça, leia, escreva e fale.', open: 'Abrir curso', units: 'Unidades', lessons: 'Lições' },
  es: { title: 'Cursos de idiomas', subtitle: 'Aprende un idioma practicando: escucha, lee, escribe y habla.', open: 'Abrir curso', units: 'Unidades', lessons: 'Lecciones' },
}
