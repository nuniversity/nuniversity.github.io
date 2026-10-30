// app/[lang]/tools/[slug]/page.tsx
export const dynamic = 'force-static'
export const revalidate = false

import { getDictionary } from '@/lib/i18n/get-dictionary'
import { type Locale } from '@/lib/i18n/config'
import { getAllTools, getToolMetadata } from '@/lib/tools/get-tool-content'
import { hasToolComponent } from '@/lib/tools/tool-registry'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { buildAlternates } from '@/lib/seo/alternates'
import ToolLoader from '@/components/tools/ToolLoader'
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer'

interface ToolPageProps {
  params: Promise<{
    lang: Locale
    slug: string
  }>
}

export async function generateStaticParams() {
  const langs: Locale[] = ['en', 'pt', 'es']
  const params: Array<{ lang: Locale; slug: string }> = []

  const slugs = new Set<string>()
  for (const lang of langs) {
    for (const tool of await getAllTools(lang)) {
      slugs.add(tool.slug)
    }
  }

  for (const lang of langs) {
    for (const slug of Array.from(slugs)) {
      params.push({ lang, slug })
    }
  }

  return params
}

export async function generateMetadata(
  props: {
    params: Promise<{ lang: Locale; slug: string }>
  }
): Promise<Metadata> {
  const params = await props.params;
  const [toolMetadata, dict] = await Promise.all([
    getToolMetadata(params.slug, params.lang),
    getDictionary(params.lang),
  ])
  const alternates = buildAlternates(params.lang, `tools/${params.slug}`)

  if (!toolMetadata) {
    return {
      alternates,
      title: dict.tools?.not_found || 'Tool Not Found',
    }
  }

  return {
    alternates,
    title: toolMetadata.title,
    description: toolMetadata.description,
    openGraph: {
      title: toolMetadata.title,
      description: toolMetadata.description,
      type: 'website',
      url: alternates.canonical,
    },
  }
}

export default async function ToolPage(props: ToolPageProps) {
  const params = await props.params;
  const { lang, slug } = params
  const dict = await getDictionary(lang)

  const toolMetadata = await getToolMetadata(slug, lang)

  if (!toolMetadata) {
    notFound()
  }

  const hasComponent = hasToolComponent(toolMetadata.slug)

  return (
    <>
      {hasComponent ? (
        <ToolLoader slug={toolMetadata.slug} lang={lang} dict={dict} />
      ) : (
        <div className="container-custom py-12">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">{toolMetadata.title}</h1>
            <p className="text-muted-foreground">
              {dict.tools?.coming_soon || 'This tool is coming soon...'}
            </p>
          </div>
        </div>
      )}

      {toolMetadata.content ? (
        <section className="container-custom pb-16" aria-labelledby="tool-about-heading">
          <div className="max-w-4xl mx-auto border-t border-border pt-8">
            <h2 id="tool-about-heading" className="text-2xl font-bold mb-4">
              {dict.tools?.about_tool || 'About this tool'}
            </h2>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <MarkdownRenderer
                content={toolMetadata.content}
                lang={lang}
                dict={dict}
                pageTitle={toolMetadata.title}
              />
            </div>
          </div>
        </section>
      ) : null}
    </>
  )
}
