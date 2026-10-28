// Browser integration — lesson rendering pipeline on real shipped pages:
// KaTeX math, syntax-highlighted code, client-rendered Mermaid, callouts,
// and the in-lesson practice question widget.
import { test, expect } from '../support/fixtures'

test.describe('lesson markdown rendering', () => {
  test('KaTeX math is rendered (aws-aif-c01 ML evaluation lesson)', async ({ page }) => {
    await page.goto('/en/courses/aws-aif-c01/04-ml-algorithms-evaluation/')
    const content = page.locator('[data-lesson-content]')
    await expect(content).toBeVisible()
    // KaTeX renders at build time (rehype-katex) — must be present in HTML.
    await expect(content.locator('.katex').first()).toBeVisible()
  })

  test('syntax-highlighted code blocks render (token spans present)', async ({ page }) => {
    // react-syntax-highlighter markup (verified in the built HTML):
    // <div style=…><code class="language-python"><span class="token">…
    await page.goto('/en/courses/langgraph-intermediate/03-conversation-memory/')
    const content = page.locator('[data-lesson-content]')
    await expect(content).toBeVisible()
    const code = content.locator('code[class*="language-"]').first()
    await expect(code).toBeVisible()
    // Token spans prove the highlighter ran; plain-text fallback fails.
    expect(await code.locator('span.token').count()).toBeGreaterThan(0)
  })

  test('Mermaid diagrams render client-side to SVG (langgraph interrupts, PT)', async ({ page }) => {
    test.setTimeout(45_000) // mermaid is heavy and renders after hydration
    await page.goto('/pt/courses/langgraph-intermediate/05-interrupts/')
    const content = page.locator('[data-lesson-content]')
    await expect(content).toBeVisible()
    // Mermaid renders asynchronously after hydration — wait for the svg.
    await expect(content.locator('svg').first()).toBeVisible({ timeout: 30_000 })
  })

  test('callout blocks keep their classes (agent-memory lesson)', async ({ page }) => {
    await page.goto('/en/courses/agent-memory-knowledge/01-foundations-of-agent-memory/')
    const content = page.locator('[data-lesson-content]')
    await expect(content).toBeVisible()
    await expect(content.locator('.callout').first()).toBeVisible()
  })

  test('in-lesson practice question: select, check, feedback, try again', async ({ page }) => {
    await page.goto('/en/courses/agent-memory-knowledge/01-foundations-of-agent-memory/')
    // QuestionBlock root carries .my-8; the lesson ships several — target one.
    const block = page
      .locator('.my-8')
      .filter({ hasText: 'Practice Question' })
      .first()
    await expect(block).toBeVisible()

    // Options are buttons inside the block (first = first option, letter chip).
    const optionButtons = block.getByRole('button').filter({ hasNotText: /check answer|try again/i })
    await optionButtons.first().click()
    await block.getByRole('button', { name: /check answer/i }).click()
    await expect(block.getByText(/correct!|incorrect/i).first()).toBeVisible()
  })
})
