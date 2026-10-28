// Artifact suite — legacy URL stubs. The old games/quiz/* and
// games/vocabulary/* URLs must keep existing as noindex redirect stubs
// pointing at the new quizzes/ and languages/ sections.
import { describe, expect, it } from 'vitest'
import { OUT_READY, LOCALES, exists, read } from './support/helpers.mjs'

const QUIZ_SLUG = 'snowpro-core-cof-c03'
const LANG_PAIR = 'en-pt'
const LANG_SLUG = 'en-to-pt'

describe.skipIf(!OUT_READY)('legacy URL redirect stubs', () => {
  it('keeps games/quiz/* stubs alive and pointing at quizzes/', () => {
    for (const locale of LOCALES) {
      const stubRel = `${locale}/games/quiz/${QUIZ_SLUG}/index.html`
      expect(exists(stubRel), `${stubRel} exists`).toBe(true)
      const stub = read(stubRel)
      expect(stub.includes('noindex'), `${locale} noindex`).toBe(true)
      expect(
        stub.includes(`href="/${locale}/quizzes/${QUIZ_SLUG}/"`),
        `${locale} links to new URL`
      ).toBe(true)
    }
  })

  it('keeps games/vocabulary/* stubs alive and pointing at languages/', () => {
    for (const locale of LOCALES) {
      const stubRel = `${locale}/games/vocabulary/${LANG_SLUG}/index.html`
      expect(exists(stubRel), `${stubRel} exists`).toBe(true)
      const stub = read(stubRel)
      expect(stub.includes('noindex'), `${locale} noindex`).toBe(true)
      expect(
        stub.includes(`href="/${locale}/languages/${LANG_PAIR}/${LANG_SLUG}/"`),
        `${locale} links to new URL`
      ).toBe(true)
    }
  })

  it('games hub links to the languages hub, not the legacy vocabulary URLs', () => {
    const hub = read('en/games/index.html')
    expect(hub.includes('/en/games/quiz/')).toBe(false)
    expect(hub.includes('/en/games/vocabulary/')).toBe(false)
    expect(hub.includes('/en/languages/')).toBe(true)
  })
})
