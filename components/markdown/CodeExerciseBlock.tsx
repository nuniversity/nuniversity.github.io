'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Code2, Play, RotateCcw, XCircle } from 'lucide-react'
import { useLessonScoreWidget } from '@/components/lessons/LessonScoreContext'
import {
  containsForbiddenApi,
  type CodeTestConfig,
  type CodeTestResult,
} from '@/lib/code/harness'
import { createSandboxRunner, type SandboxRunner } from '@/lib/code/run-javascript'

export interface CodeExerciseConfig {
  id: string
  title: string
  instructions: string
  language: 'javascript'
  starter: string
  solution?: string
  tests: CodeTestConfig[]
  explanation?: string
}

interface CodeExerciseBlockProps {
  data: CodeExerciseConfig
  dict?: any
}

export default function CodeExerciseBlock({ data, dict }: CodeExerciseBlockProps) {
  const t = dict?.codeExercise
  const [code, setCode] = useState(data.starter)
  const [results, setResults] = useState<CodeTestResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const runnerRef = useRef<SandboxRunner | null>(null)
  const { scoreId, register, report } = useLessonScoreWidget('codeexercise')

  useEffect(() => {
    register({ id: scoreId, label: data.title, total: data.tests.length })
  }, [register, scoreId, data.title, data.tests.length])

  useEffect(() => {
    if (!results) return
    report({
      id: scoreId,
      label: data.title,
      total: data.tests.length,
      correct: results.filter((result) => result.passed).length,
      missed: results.filter((result) => !result.passed).map((result) => result.name),
      answered: true,
      key: data.id,
    })
  }, [report, scoreId, data.id, data.title, data.tests.length, results])

  useEffect(() => () => runnerRef.current?.dispose(), [])

  const run = async () => {
    if (!iframeRef.current) return
    setError(null)
    if (containsForbiddenApi(code)) {
      setError(
        t?.forbidden ||
          'Remove network or eval calls: exercises run in a closed sandbox.'
      )
      return
    }
    if (!runnerRef.current) runnerRef.current = createSandboxRunner(iframeRef.current)
    setRunning(true)
    const outcome = await runnerRef.current.run(code, data.tests)
    setRunning(false)
    if (Array.isArray(outcome)) {
      setResults(outcome)
    } else {
      setError(outcome.error)
      setResults(null)
    }
  }

  const reset = () => {
    setCode(data.starter)
    setResults(null)
    setError(null)
  }

  const passed = results?.filter((result) => result.passed).length ?? 0

  return (
    <div className="my-8 rounded-xl border bg-card shadow-sm" data-audio-skip>
      <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3 text-sm font-semibold">
        <Code2 className="h-4 w-4 text-primary" />
        {data.title}
        <span className="ml-auto text-xs font-normal text-muted-foreground">{data.language}</span>
      </div>
      <div className="space-y-3 p-4 sm:p-6">
        <p className="text-sm text-foreground/80">{data.instructions}</p>
        <textarea
          value={code}
          onChange={(event) => setCode(event.target.value)}
          spellCheck={false}
          rows={Math.min(16, Math.max(6, code.split('\n').length + 1))}
          className="w-full resize-y rounded-lg border border-border bg-background p-3 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          aria-label={t?.editor || 'Code editor'}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={run}
            disabled={running}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Play className="h-4 w-4" />
            {running ? t?.running || 'Running…' : t?.run || 'Run tests'}
          </button>
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            <RotateCcw className="h-4 w-4" />
            {t?.reset || 'Reset'}
          </button>
        </div>
        <iframe
          ref={iframeRef}
          src="/code-sandbox.html"
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          title="Code sandbox"
          className="hidden"
        />
        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
            {error}
          </p>
        )}
        {results && (
          <div aria-live="polite" className="space-y-1">
            <p className="text-sm font-medium">
              {passed}/{data.tests.length} {t?.passed || 'tests passed'}
            </p>
            {results.map((result) => (
              <p
                key={result.name}
                className={`flex items-start gap-2 text-sm ${
                  result.passed
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-red-700 dark:text-red-400'
                }`}
              >
                {result.passed ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4" />
                ) : (
                  <XCircle className="mt-0.5 h-4 w-4" />
                )}
                <span>
                  {result.name}
                  {!result.passed &&
                    (result.error
                      ? `: ${result.error}`
                      : `: got ${JSON.stringify(result.actual)}`)}
                </span>
              </p>
            ))}
            {passed === data.tests.length && data.explanation && (
              <p className="pt-2 text-sm text-foreground/80">{data.explanation}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
