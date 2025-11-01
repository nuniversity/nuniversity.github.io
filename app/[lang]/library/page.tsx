// app/[lang]/library/page.tsx
export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getAllResources } from '@/lib/library/get-library-resources'
import { Metadata } from 'next'
import { LibraryClient } from './library-client'

interface LibraryPageProps {
  params: { lang: Locale }
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Locale }
}): Promise<Metadata> {
  const dict = await getDictionary(params.lang)
  
  return {
    title: dict.library?.title || 'Learning Library',
    description: dict.library?.subtitle || 'Curated collection of educational resources',
    openGraph: {
      title: dict.library?.title || 'Learning Library',
      description: dict.library?.subtitle || 'Curated collection of educational resources',
      type: 'website',
    },
  }
}

export default async function LibraryPage({ params }: LibraryPageProps) {
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