import type { CodeTestConfig, CodeTestResult } from './harness'
import { newNonce } from './harness'

export interface SandboxRunner {
  run: (code: string, tests: CodeTestConfig[]) => Promise<CodeTestResult[] | { error: string }>
  dispose: () => void
}

const TIMEOUT_MS = 3000

/**
 * Drives the sandbox iframe via postMessage. The frame has an opaque origin, so
 * `event.origin` is the string "null"; identity is established with
 * `event.source === iframe.contentWindow` plus a per-run nonce.
 * On timeout the iframe is reloaded, which kills any runaway execution.
 */
export function createSandboxRunner(iframe: HTMLIFrameElement): SandboxRunner {
  const pending = new Map<
    string,
    { resolve: (value: CodeTestResult[] | { error: string }) => void; timer: ReturnType<typeof setTimeout> }
  >()

  const onMessage = (event: MessageEvent) => {
    if (event.source !== iframe.contentWindow) return
    const data = event.data as {
      nonce?: string
      type?: string
      results?: CodeTestResult[]
      error?: string
    }
    if (!data || typeof data.nonce !== 'string') return
    const entry = pending.get(data.nonce)
    if (!entry) return
    clearTimeout(entry.timer)
    pending.delete(data.nonce)
    if (data.type === 'done' && Array.isArray(data.results)) entry.resolve(data.results)
    else entry.resolve({ error: data.error || 'Sandbox error' })
  }

  window.addEventListener('message', onMessage)

  return {
    run(code, tests) {
      return new Promise((resolve) => {
        const nonce = newNonce()
        const timer = setTimeout(() => {
          pending.delete(nonce)
          iframe.src = iframe.src // reload: terminates runaway execution
          resolve({ error: 'Time limit exceeded (3s). Check for an infinite loop.' })
        }, TIMEOUT_MS)
        pending.set(nonce, { resolve, timer })
        iframe.contentWindow?.postMessage({ nonce, code, tests }, '*')
      })
    },
    dispose() {
      window.removeEventListener('message', onMessage)
      Array.from(pending.values()).forEach((entry) => clearTimeout(entry.timer))
      pending.clear()
    },
  }
}
