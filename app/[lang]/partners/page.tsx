// app/[lang]/partners/page.tsx
import PartnersView from '@/components/partners/PartnersPage'
import { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { buildAlternates } from '@/lib/seo/alternates'

export async function generateMetadata({
  params }: {
  params: { lang: Locale }
}): Promise<Metadata> {
  const dict = await getDictionary(params.lang)

  return {
    alternates: buildAlternates(params.lang, 'partners'),
    title: dict.metadata.partners.title,
    description: dict.metadata.partners.description,
    openGraph: {
      title: dict.metadata.partners.title,
      description: dict.metadata.partners.description,
      type: 'website',
      locale: params.lang === 'en' ? 'en_US' : params.lang === 'pt' ? 'pt_BR' : 'es_ES' } }
}

export default async function PartnersPage({
  params }: {
  params: { lang: Locale }
}) {
  const dict = await getDictionary(params.lang)

  return <PartnersView lang={params.lang} dict={dict} />
}
