'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RotateCcw } from 'lucide-react'

interface LessonErrorBoundaryProps {
  children: ReactNode
}

interface LessonErrorBoundaryState {
  error: Error | null
}

/**
 * Guards the rendered lesson body. A single malformed fence must degrade to a
 * friendly retry card instead of blanking the whole page (audit ARCH-04).
 * Chrome only: marked data-audio-skip so the read-aloud feature ignores it.
 */
export default class LessonErrorBoundary extends Component<LessonErrorBoundaryProps, LessonErrorBoundaryState> {
  state: LessonErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): LessonErrorBoundaryState {
    return { error }
  }

  private reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          data-audio-skip
          className="my-8 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-6 text-center"
        >
          <AlertTriangle className="mx-auto h-8 w-8 text-red-600 dark:text-red-400" />
          <p className="mt-3 font-medium text-red-800 dark:text-red-200">
            This part of the lesson failed to render.
          </p>
          <p className="mt-1 break-words text-sm text-red-700/80 dark:text-red-300/80">
            {this.state.error.message}
          </p>
          <button
            type="button"
            onClick={this.reset}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-100 dark:border-red-800 dark:text-red-200 dark:hover:bg-red-900/40"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
