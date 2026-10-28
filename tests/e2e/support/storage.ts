// tests/e2e/support/storage.ts
//
// The app persists all learner state in localStorage under the `v1:` namespace
// (progress, quiz history/best, practice answers, language activities,
// profile) plus the `theme` key. Tests must start from a deterministic slate:
// the fixture wipes these keys BEFORE any page script runs (addInitScript),
// and can seed exact state for journey tests.
export const STORAGE_NAMESPACE = 'v1:'
export const THEME_KEY = 'theme'

/** Serialized script: removes all app state keys before page scripts run. */
export function wipeScript(): string {
  return `
    (() => {
      try {
        const doomed = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('${STORAGE_NAMESPACE}') || k === '${THEME_KEY}')) doomed.push(k);
        }
        doomed.forEach((k) => localStorage.removeItem(k));
      } catch (_) {
        /* storage unavailable — nothing to wipe */
      }
    })()
  `
}

/**
 * Serialized script: seeds localStorage entries before page scripts run.
 * Keys must already be namespaced (e.g. 'v1:profile'); values may be any
 * JSON-serializable value or a raw string.
 */
export function seedScript(state: Record<string, unknown>): string {
  const entries = Object.entries(state).map(([k, v]) => [
    k,
    typeof v === 'string' ? v : JSON.stringify(v),
  ])
  return `
    (() => {
      try {
        const entries = ${JSON.stringify(entries)};
        for (const [k, v] of entries) localStorage.setItem(k, v);
      } catch (_) {
        /* storage unavailable — seeding skipped */
      }
    })()
  `
}
