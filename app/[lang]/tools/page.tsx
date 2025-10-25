// app/[lang]/tools/page.tsx
export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getAllTools } from '@/lib/tools/get-tool-content'
import { Metadata } from 'next'
import { ToolsClient } from './tools-client'

interface ToolsPageProps {
  params: { lang: Locale }
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Locale }
}): Promise<Metadata> {
  const dict = await getDictionary(params.lang)
  
  return {
    title: dict.tools?.title || 'Tools',
    description: dict.tools?.subtitle || 'Powerful tools to enhance your learning',
  }
}

export default async function ToolsPage({ params }: ToolsPageProps) {
  const { lang } = params
  const dict = await getDictionary(lang)
  
  const allTools = await getAllTools(lang)

  return (
    <ToolsClient 
      lang={lang}
      tools={allTools}
      dict={dict}
    />
  )
}