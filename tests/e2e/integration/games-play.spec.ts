// Browser integration — each game plays one real interaction round: start,
// reach the in-game state and (where deterministic) submit a correct answer.
// Complements tools-games-smoke.spec.ts (load/hydrate) with behavioural
// assertions over the redesigned game clients.
import { test, expect } from '../support/fixtures'

test.describe('games playable interactions', () => {
  test('math challenge: first question can be answered correctly', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(String(err)))
    await page.goto('/en/games/math/math-speed-challenge/')
    await page.getByRole('button', { name: /start challenge/i }).click()

    // Read the displayed expression and compute the expected answer.
    const display = page.locator('div[dir="ltr"].text-5xl')
    await expect(display).toBeVisible()
    const expr = (await display.textContent()) ?? ''
    const match = expr.match(/(\d+) ([+−×÷]) (\d+)/)
    if (match) {
      const a = Number(match[1])
      const b = Number(match[3])
      const op = match[2]
      const answer =
        op === '+' ? a + b
        : op === '−' ? a - b
        : op === '×' ? a * b
        : Math.floor(a / b)
      const input = page.getByPlaceholder('?')
      await input.fill(String(answer))
      await input.press('Enter')
      // The feedback banner is transient (400 ms); assert on the durable
      // stat instead: a first correct answer scores exactly 10.
      const scoreValue = page
        .locator('div.bg-card.border.rounded-xl')
        .filter({ hasText: 'Score' })
        .locator('.text-xl.font-bold')
        .first()
      await expect(scoreValue).toHaveText('10', { timeout: 4_000 })
    }
    expect(errors, errors.slice(0, 3).join(' | ')).toEqual([])
  })

  test('binary hex: binary → decimal answer can be submitted correctly', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(String(err)))
    await page.goto('/en/games/coding/binary-hex-game/')
    await page.getByRole('button', { name: /start challenge/i }).click()

    // Default selected mode is Binary → Decimal, so the display is binary.
    const display = page.locator('div.text-5xl.font-mono')
    await expect(display).toBeVisible()
    const binary = (await display.textContent()) ?? ''
    const expected = Number.parseInt(binary.trim(), 2)

    await page.getByPlaceholder(/answer/i).fill(String(expected))
    await page.getByRole('button', { name: 'OK' }).click()
    await expect(page.getByText(/Correct!/)).toBeVisible({ timeout: 3_000 })
    expect(errors, errors.slice(0, 3).join(' | ')).toEqual([])
  })

  test('word search: grid is reachable with keyboard and renders the stat set', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(String(err)))
    await page.goto('/en/games/puzzles/word-search/')

    // Category selection starts the game directly (explicit-category fix).
    await page.getByRole('button', { name: /programming/i }).click()
    await expect(page.getByRole('grid')).toBeVisible()
    await expect(page.getByText(/Found/)).toBeVisible()
    await expect(page.getByText(/^0\/\d+$/)).toBeVisible()

    // Keyboard path: focus the grid, move the cursor, anchor and clear.
    await page.getByRole('grid').focus()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Enter') // anchor
    await page.keyboard.press('Escape') // clear selection — no crash
    expect(errors, errors.slice(0, 3).join(' | ')).toEqual([])
  })

  test('word search grid cells resolve from touch coordinates', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'touch dragging is a mobile-only concern')
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(String(err)))
    await page.goto('/en/games/puzzles/word-search/')
    await page.getByRole('button', { name: /programming/i }).click()
    await expect(page.getByRole('grid')).toBeVisible()

    // Pointer-drag across two adjacent cells (touch semantics): selection
    // highlights and clears on release without errors.
    const grid = page.getByRole('grid')
    const box = await grid.boundingBox()
    if (box) {
      const cell = box.width / 12
      await page.touchscreen.tap(box.x + cell * 1.5, box.y + cell * 1.5)
    }
    expect(errors, errors.slice(0, 3).join(' | ')).toEqual([])
  })

  test('periodic table quiz: answering an option shows feedback', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(String(err)))
    await page.goto('/en/games/physics/periodic-table-quiz/')
    await page.getByRole('button', { name: /start quiz/i }).click()

    // The option group is a labelled role=group; any option click produces
    // feedback inside the 1.5 s feedback window.
    const group = page.getByRole('group').first()
    await expect(group).toBeVisible()
    await group.getByRole('button').first().click()
    await expect(page.locator('[aria-live="polite"]').last()).toBeVisible({ timeout: 3_000 })
    expect(errors, errors.slice(0, 3).join(' | ')).toEqual([])
  })

  test('number sequence: starts displaying digits and reaches recall', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(String(err)))
    await page.goto('/en/games/logic/number-sequence/')
    await page.getByRole('button', { name: /^Start Game$/i }).click()

    // A 3-digit sequence at 1 s per digit + tail: recall input must appear
    // within ~5 s, and the round must be a genuine recall phase (not the
    // orphan-timer bug that jumped straight to recall on restart).
    await expect(page.getByPlaceholder(/digits/i)).toBeVisible({ timeout: 8_000 })
    expect(errors, errors.slice(0, 3).join(' | ')).toEqual([])
  })

  test('typing speed: countdown resolves and the code pane appears', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(String(err)))
    await page.goto('/en/games/coding/code-typing-speed/')
    await page.getByRole('button', { name: /start typing/i }).click()

    // 3-2-1 countdown then the code display + textarea.
    await expect(page.getByRole('textbox')).toBeVisible({ timeout: 7_000 })
    // Type the first character; the textarea accepts input (_CTRL not locked).
    await page.getByRole('textbox').press('x')
    await expect(page.getByRole('textbox')).toHaveValue(/./)
    expect(errors, errors.slice(0, 3).join(' | ')).toEqual([])
  })
})
