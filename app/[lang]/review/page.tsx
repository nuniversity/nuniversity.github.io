import { type Locale, i18n } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import ReviewClient from '@/components/review/ReviewClient'
import { pageMetadata } from '@/lib/seo/metadata'
import type { Metadata } from 'next'

export const dynamic = 'force-static'
export const revalidate = false

export async function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }))
}

export async function generateMetadata({ params }: { params: { lang: Locale } }): Promise<Metadata> {
  return pageMetadata({
    lang: params.lang,
    path: 'review',
    title: 'Daily review',
    description: 'Spaced repetition across all your courses.',
    type: 'article',
  })
}

export default async function ReviewPage({ params }: { params: { lang: Locale } }) {
  const dict = await getDictionary(params.lang)
  return (
    <div className="container-custom py-12">
      <h1 className="mb-2 text-3xl font-bold">{dict.review?.heading || 'Daily review'}</h1>
      <p className="mb-8 text-muted-foreground">
        {dict.review?.subtitle || 'Spaced repetition across all your courses.'}
      </p>
      <div className="max-w-3xl">
        <ReviewClient lang={params.lang} dict={dict} />
      </div>
    </div>
  )
}
