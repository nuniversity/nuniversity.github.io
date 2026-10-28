// E2E journey — route sweep: every core route in every locale loads with
// HTTP 200, a non-empty <title>, and zero page errors. Data-driven from the
// same route list the artifact suite uses; this is the net that catches any
// broken page the narrower specs don't visit.
import { test, expect } from '../support/fixtures'
import { readdirSync } from 'node:fs'
import path from 'node:path'

const LOCALES = ['en', 'pt', 'es'] as const

const CORE_ROUTES = [
  '/',
  '/about/',
  '/contact/',
  '/library/',
  '/partners/',
  '/tools/',
  '/games/',
  '/quizzes/',
  '/quizzes/certificates/',
  '/roadmaps/',
  '/languages/',
  '/languages/en-pt/',
  '/courses/',
] as const

// Plus one detail page per content type, derived from content at collect time.
const GAMES_ROOT = path.join(__dirname, '../../../content/games')
const firstGame = (cat: string) => {
  const dir = path.join(GAMES_ROOT, cat)
  const json = readdirSync(dir).find((f) => f.endsWith('.json'))
  return json ? json.replace(/\.json$/, '') : null
}
const detailRoutes = [
  '/courses/agent-memory-knowledge/',
  '/courses/agent-memory-knowledge/01-foundations-of-agent-memory/',
  '/courses/aws-clf-c02/practice/',
  '/tools/pomodoro-timer/',
  '/tools/swot-matrix/',
  '/quizzes/snowpro-core-cof-c03/',
  '/roadmaps/intro-to-software-engineering/',
  '/languages/en-pt/en-to-pt/',
  ...(firstGame('coding') ? [`/games/coding/${firstGame('coding')}/`] : []),
  ...(firstGame('logic') ? [`/games/logic/${firstGame('logic')}/`] : []),
] as const

test.describe('route sweep', () => {
  for (const locale of LOCALES) {
    for (const route of [...CORE_ROUTES, ...detailRoutes]) {
      test(`[${locale}] ${route}`, async ({ page }) => {
        const errors: string[] = []
        page.on('pageerror', (err) => errors.push(String(err)))

        const response = await page.goto(`/${locale}${route}`)
        expect(response?.status(), `HTTP status for ${locale}${route}`).toBe(200)

        const title = await page.title()
        expect(title.trim(), `title for ${locale}${route}`).not.toBe('')

        // Every page must carry the CSP meta (belt-and-suspenders with the
        // artifact suite — here it's enforced in the real browser).
        const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').count()
        expect(csp, `CSP meta on ${locale}${route}`).toBeGreaterThan(0)

        expect(
          errors,
          `page errors on ${locale}${route}: ${errors.slice(0, 3).join(' | ')}`
        ).toEqual([])
      })
    }
  }
})
