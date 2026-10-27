'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { FileQuestion } from 'lucide-react'

interface NotFoundSection {
  title?: string
  description?: string
  missing?: string
  go_home?: string
  go_courses?: string
  more_links?: string
}

interface NotFoundDict {
  notFound?: NotFoundSection
  all?: Record<string, NotFoundSection | undefined>
}

interface NotFoundClientProps {
  lang: string
  dict: NotFoundDict
}

export default function NotFoundClient({ lang, dict }: NotFoundClientProps) {
  const [missing, setMissing] = useState<string | null>(null)
  const [pathLang, setPathLang] = useState<string>(lang)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setMissing(params.get('p') ?? window.location.pathname)
    setPathLang(window.location.pathname.split('/')[1] || lang)
  }, [lang])

  const n = dict?.all?.[pathLang] ?? dict?.notFound ?? {}

  return (
    <div className="container-custom py-20">
      <div className="max-w-xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <FileQuestion className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-5xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">{n.title ?? 'Page Not Found'}</h2>
        <p className="text-muted-foreground mb-4">
          {n.description ?? "The page you're looking for doesn't exist or has been moved."}
        </p>
        {missing && (
          <p className="text-sm text-muted-foreground mb-8 break-all">
            {n.missing ?? 'Requested path'}:{' '}
            <code className="bg-muted px-2 py-1 rounded">{missing}</code>
          </p>
        )}
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href={`/${pathLang}/`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            {n.go_home ?? 'Go to Home'}
          </Link>
          <Link
            href={`/${pathLang}/courses/`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-accent transition-colors"
          >
            {n.go_courses ?? 'Browse Courses'}
          </Link>
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          {n.more_links ?? 'You can also explore our tools and games.'}
        </p>
      </div>
    </div>
  )
}
