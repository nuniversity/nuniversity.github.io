'use client'

import Link from '@/components/navigation/AppLink'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

/**
 * The error boundary for the `[lang]` segment.
 *
 * A crash in one of the large client components (there are a handful over
 * 300 lines) previously took down the whole page with no recovery path.
 * This catches it, explains what happened, and offers a way back.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="container-custom py-20">
      <div className="mx-auto max-w-xl text-center">
        <div className="mb-6 flex justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-soft text-danger">
            <AlertTriangle className="h-8 w-8" aria-hidden="true" />
          </span>
        </div>

        <h1 className="mb-3 text-3xl font-bold tracking-tight text-foreground">
          Something went wrong
        </h1>
        <p className="mb-6 leading-relaxed text-foreground-muted">
          This page failed to load. You can try again, or head back to a section that is working.
        </p>

        {error.digest && (
          <p className="mb-6 text-xs text-foreground-subtle">
            Reference: <code className="rounded bg-muted px-1.5 py-0.5">{error.digest}</code>
          </p>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn btn-primary">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
          <Link href="/" className="btn btn-secondary">
            <Home className="h-4 w-4" aria-hidden="true" />
            Go to home
          </Link>
        </div>
      </div>
    </div>
  )
}
