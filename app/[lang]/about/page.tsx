import { Metadata } from 'next';
import { getDictionary } from '@/lib/i18n/get-dictionary';
import { type Locale } from '@/lib/i18n/config';
import AboutPageClient from './AboutPageClient';

export async function generateMetadata({
  params,
}: {
  params: { lang: Locale }
}): Promise<Metadata> {
  const dict = await getDictionary(params.lang);
  
  return {
    title: dict.metadata.about.title,
    description: dict.metadata.about.description,
    openGraph: {
      title: dict.metadata.about.title,
      description: dict.metadata.about.description,
      type: 'website',
      locale: params.lang === 'en' ? 'en_US' : params.lang === 'pt' ? 'pt_BR' : 'es_ES',
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: { lang: Locale }
}) {
  const dict = await getDictionary(params.lang);
  
  return <AboutPageClient content={dict.about} />;
}