// app/[lang]/page.tsx
import Hero from '@/components/home/Hero'
import Features from '@/components/home/Features'
import Contact from '@/components/contacts/Contact'
import { Metadata } from 'next'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'


export async function generateMetadata({
  params,
}: {
  params: { lang: Locale }
}): Promise<Metadata> {
  const dict = await getDictionary(params.lang)
  
  return {
    title: dict.metadata.home.title,
    description: dict.metadata.home.description,
    openGraph: {
      title: dict.metadata.home.title,
      description: dict.metadata.home.description,
      type: 'website',
      locale: params.lang === 'en' ? 'en_US' : params.lang === 'pt' ? 'pt_BR' : 'es_ES',
    },
  }
}

export default async function HomePage({
  params,
}: {
  params: { lang: Locale }
}) {
  const dict = await getDictionary(params.lang)

  return (
    <>
      <Hero lang={params.lang} dict={dict} />
      <Features lang={params.lang} dict={dict} />
    </>
  )
}