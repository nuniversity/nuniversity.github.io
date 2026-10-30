// app/[lang]/library/page.tsx
export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getAllResources } from '@/lib/library/get-library-resources'
import { Metadata } from 'next'
import { LibraryClient } from './library-client'
import { buildAlternates } from '@/lib/seo/alternates'

interface LibraryPageProps {
  params: Promise<{ lang: Locale }>
}

export async function generateMetadata(
  props: {
    params: Promise<{ lang: Locale }>
  }
): Promise<Metadata> {
  const params = await props.params;
  const dict = await getDictionary(params.lang)

  return {
    alternates: buildAlternates(params.lang, 'library'),
    title: dict.library?.title || 'Learning Library',
    description: dict.library?.subtitle || 'Curated collection of educational resources',
    openGraph: {
      title: dict.library?.title || 'Learning Library',
      description: dict.library?.subtitle || 'Curated collection of educational resources',
      type: 'website' } }
}

export default async function LibraryPage(props: LibraryPageProps) {
  const params = await props.params;
  const { lang } = params
  const dict = await getDictionary(lang)

  const allResources = await getAllResources(lang)

  return (
    <LibraryClient 
      lang={lang}
      resources={allResources}
      dict={dict}
    />
  )
}