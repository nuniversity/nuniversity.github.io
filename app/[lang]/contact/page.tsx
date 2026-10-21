// app/[lang]/contact/page.tsx
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
    title: dict.metadata.contact.title,
    description: dict.metadata.contact.description,
    openGraph: {
      title: dict.metadata.contact.title,
      description: dict.metadata.contact.description,
      type: 'website',
      locale: params.lang === 'en' ? 'en_US' : params.lang === 'pt' ? 'pt_BR' : 'es_ES',
    },
  }
}

export default async function ContactPage({
  params,
}: {
  params: { lang: Locale }
}) {
  const dict = await getDictionary(params.lang)

  return <Contact lang={params.lang} dict={dict} />
}
