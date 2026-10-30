import { describe, expect, it } from 'vitest'
import { getAllAnalyses, getAnalysis } from '@/lib/library/get-library-resources'

describe('library analysis content', () => {
  it('loads analysis resources with quizzes and internal URLs', async () => {
    const analyses = await getAllAnalyses('en')
    expect(analyses.length).toBeGreaterThanOrEqual(2)
    for (const analysis of analyses) {
      expect(analysis.type).toBe('analysis')
      expect(analysis.url).toBe(`/en/library/analysis/${analysis.id}/`)
      expect(analysis.analysis?.quiz.length).toBeGreaterThan(0)
      expect(analysis.content?.length).toBeGreaterThan(50)
    }
  })

  it('renders quiz answer metadata safely', async () => {
    const analysis = await getAnalysis('cs50-fast-start', 'en')
    expect(analysis?.title).toContain('CS50')
    expect(analysis?.analysis?.takeaways.length).toBeGreaterThan(0)
    for (const question of analysis?.analysis?.quiz ?? []) {
      expect(question.options.length).toBeGreaterThan(1)
      expect(question.correct).toBeGreaterThanOrEqual(0)
      expect(question.correct).toBeLessThan(question.options.length)
    }
  })
})
