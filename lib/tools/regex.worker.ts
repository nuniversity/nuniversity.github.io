/// <reference lib="webworker" />

import { evaluateRegex, type RegexEvaluation } from './regex'

interface WorkerRequest {
  id: number
  request: {
    pattern: string
    flags: string
    testString: string
    replacement: string
    showReplace: boolean
    maxMatches?: number
  }
}

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null
  postMessage: (value: { id: number; result: RegexEvaluation }) => void
}

scope.onmessage = (event) => {
  const { id, request } = event.data
  scope.postMessage({ id, result: evaluateRegex(request) })
}
