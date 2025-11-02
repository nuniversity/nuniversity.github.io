// app/[lang]/tools/[slug]/page.tsx
export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getAllTools, getToolMetadata } from '@/lib/tools/get-tool-content'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import dynamicImport from 'next/dynamic'

interface ToolPageProps {
  params: { 
    lang: Locale
    slug: string
  }
}

// Dynamic imports for tools
const LLMPromptBuilder = dynamicImport(() => import('@/components/tools/LLMPromptBuilder'), {
  ssr: false,
})

const BrainWritingSession = dynamicImport(() => import('@/components/tools/BrainWritingSession'), {
  ssr: false,
})

const SWOTMatrix = dynamicImport(() => import('@/components/tools/SWOTMatrix'), {
  ssr: false,
})

const EisenhowerMatrix = dynamicImport(() => import('@/components/tools/EisenhowerMatrix'), {
  ssr: false,
})

const toolComponents: Record<string, any> = {
  'llm-prompt-builder': LLMPromptBuilder,
  'brain-writing-session': BrainWritingSession,
  'swot-matrix': SWOTMatrix,
  'eisenhower-matrix': EisenhowerMatrix
}

export async function generateStaticParams() {
  const langs: Locale[] = ['en', 'pt', 'es']
  const params = []

  for (const lang of langs) {
    const tools = await getAllTools(lang)
    for (const tool of tools) {
      params.push({
        lang,
        slug: tool.slug,
      })
    }
  }

  return params
}

export async function generateMetadata({
  params,
}: {
  params: { lang: Locale; slug: string }
}): Promise<Metadata> {
  const toolMetadata = await getToolMetadata(params.slug, params.lang)
  
  if (!toolMetadata) {
    return {
      title: 'Tool Not Found',
    }
  }
  
  return {
    title: toolMetadata.title,
    description: toolMetadata.description,
  }
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { lang, slug } = params
  const dict = await getDictionary(lang)
  
  const toolMetadata = await getToolMetadata(slug, lang)
  
  if (!toolMetadata) {
    notFound()
  }

  const ToolComponent = toolComponents[slug]

  if (!ToolComponent) {
    return (
      <div className="container-custom py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">{toolMetadata.title}</h1>
          <p className="text-muted-foreground">This tool is coming soon...</p>
        </div>
      </div>
    )
  }

  return <ToolComponent lang={lang} dict={dict} />
}