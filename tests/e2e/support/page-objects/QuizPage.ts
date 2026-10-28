// tests/e2e/support/page-objects/QuizPage.ts
//
// Locators for the quizzes app: hub (/en/quizzes/), quiz detail
// (/en/quizzes/{quizSlug}/), the practice player and the score report.
// UI reference: components/quizzes/{QuizHome,QuizPlayer,ScoreReport}.tsx.
import { type Locator, type Page, expect } from '@playwright/test'

export class QuizHubPage {
  readonly page: Page
  readonly search: Locator
  readonly quizCards: Locator
  readonly certificatesLink: Locator

  constructor(page: Page) {
    this.page = page
    this.search = page.getByRole('textbox', { name: 'Search quizzes' })
    this.quizCards = page.locator('a[href*="/quizzes/"][href$="/"]:not([data-testid])').filter({ has: page.locator('h3') })
    this.certificatesLink = page.getByTestId('certificates-link')
  }

  async goto(locale = 'en') {
    await this.page.goto(`/${locale}/quizzes/`)
  }

  async openFirstQuiz() {
    await this.quizCards.first().click()
    await this.page.waitForURL(/\/quizzes\/[^/]+\/$/)
  }
}

export class QuizDetailPage {
  readonly page: Page
  readonly title: Locator
  readonly startPractice: Locator
  readonly startExam: Locator

  constructor(page: Page) {
    this.page = page
    this.title = page.locator('h1')
    this.startPractice = page.getByRole('button', { name: /start practice/i })
    this.startExam = page.getByRole('button', { name: /start mock exam|begin exam/i })
  }

  /** Launch the practice player and wait for the first question. */
  async launchPractice() {
    await this.startPractice.click()
    await this.page.waitForURL(/\/practice\//)
    return new QuizPlayerPage(this.page)
  }
}

export class QuizPlayerPage {
  readonly page: Page
  readonly exit: Locator
  readonly progress: Locator
  readonly questionHeading: Locator
  readonly answerGroup: Locator
  readonly answers: Locator
  readonly checkAnswer: Locator
  readonly nextQuestion: Locator
  readonly seeResults: Locator

  constructor(page: Page) {
    this.page = page
    this.exit = page.getByRole('button', { name: /exit/i })
    this.progress = page.getByText(/question \d+ of \d+/i)
    this.questionHeading = page.locator('h2')
    this.answerGroup = page.getByRole('radiogroup', { name: 'Answer options' })
    this.answers = this.answerGroup.getByRole('radio')
    this.checkAnswer = page.getByRole('button', { name: /check answer/i })
    this.nextQuestion = page.getByRole('button', { name: /next question/i })
    this.seeResults = page.getByRole('button', { name: /see results/i })
  }

  /** Answer the current question with the first option and check it. */
  async answerFirstAndCheck() {
    await expect(this.answerGroup).toBeVisible()
    await this.answers.first().click()
    await expect(this.checkAnswer).toBeEnabled()
    await this.checkAnswer.click()
  }

  /** Advance after checking; on the last question, see results instead. */
  async advance() {
    if (await this.seeResults.isVisible().catch(() => false)) {
      await this.seeResults.click()
    } else {
      await this.nextQuestion.click()
    }
  }

  async expectScoreReport() {
    return new ScoreReportPage(this.page)
  }
}

export class ScoreReportPage {
  readonly page: Page
  readonly heading: Locator
  readonly playAgain: Locator
  readonly reviewAnswers: Locator

  constructor(page: Page) {
    this.page = page
    this.heading = page.getByRole('heading', { name: /quiz complete|exam complete|pass|fail/i })
    this.playAgain = page.getByRole('button', { name: /play again|retake exam/i })
    this.reviewAnswers = page.getByRole('button', { name: /review answers|review all answers/i })
  }
}
