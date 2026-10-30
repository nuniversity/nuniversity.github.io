'use client'

import { useEffect, useRef, useState } from 'react'
import { evaluateRegex, type RegexEvaluation, type RegexRequest } from './regex'

const EMPTY: RegexEvaluation = {
  valid: true,
  matches: [],
  matchCount: 0,
  totalLength: 0,
  replaced: null,
  error: null,
  truncated: false,
}

interface WorkerRequest {
  id: number
  request: RegexRequest
}

interface WorkerResponse {
  id: number
  result: RegexEvaluation
}

/**
 * Evaluates a regex off the main thread.
 *
 * Catastrophic backtracking (`(a+)+$`) previously froze the tab because the
 * pattern ran synchronously inside `useMemo`. A dedicated worker absorbs that
 * cost; a 2s watchdog terminates it and reports a timeout. If workers are
 * unavailable the hook falls back to the synchronous engine.
 */
export function useRegexEvaluator(request: RegexRequest, delayMs = 120) {
  const [result, setResult] = useState<RegexEvaluation>(EMPTY)
  const [timedOut, setTimedOut] = useState(false)
  const workerRef = useRef<Worker | null>(null)
  const requestId = useRef(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  useEffect(() => {
    const debounce = setTimeout(() => {
      const id = ++requestId.current
      setTimedOut(false)

      if (typeof Worker === 'undefined') {
        setResult(evaluateRegex(request))
        return
      }

      try {
        if (!workerRef.current) {
          workerRef.current = new Worker(
            new URL('./regex.worker.ts', import.meta.url),
            { type: 'module' }
          )
        }
        const worker = workerRef.current
        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
          if (event.data.id !== requestId.current) return
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          setResult(event.data.result)
        }
        worker.onerror = () => {
          // Worker failed to load (CSP, unsupported browser): degrade to the
          // synchronous engine rather than leaving the UI empty forever.
          if (timeoutRef.current) clearTimeout(timeoutRef.current)
          setResult(evaluateRegex(request))
        }

        const message: WorkerRequest = { id, request }
        worker.postMessage(message)

        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        timeoutRef.current = setTimeout(() => {
          if (requestId.current !== id) return
          workerRef.current?.terminate()
          workerRef.current = null
          setTimedOut(true)
        }, 2000)
      } catch {
        setResult(evaluateRegex(request))
      }
    }, delayMs)

    return () => clearTimeout(debounce)
  }, [request, delayMs])

  return { result, timedOut }
}
