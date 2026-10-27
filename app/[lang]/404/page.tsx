import { i18n, type Locale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { Metadata } from 'next'
import NotFoundClient from './not-found-client'
import { buildAlternates } from '@/lib/seo/alternates'

export function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }))
}

export async function generateMetadata({
  params }: {
  params: { lang: Locale }
}): Promise<Metadata> {
  const dict = await getDictionary(params.lang)

  return {
    alternates: buildAlternates(params.lang, '404'),
    title: dict.metadata.notFound.title,
    description: dict.metadata.notFound.description }
}

export default async function Localized404Page({
  params }: {
  params: { lang: Locale }
}) {
  const dict = await getDictionary(params.lang)

  return <NotFoundClient lang={params.lang} dict={{ notFound: dict.notFound }} />
}
