import { defineConfig, devices } from '@playwright/test'

// Tests run against the BUILT static export in `out/`, served by a local
// static server that mirrors GitHub Pages semantics (trailing-slash
// redirects, 404.html fallback). The build must exist before running:
//   npm run build && npm run test:e2e
// In CI the workflow builds first, so the same artifact that gets deployed
// is the one under test.

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [
        ['html', { outputFolder: 'playwright-report', open: 'never' }],
        ['github'],
        ['json', { outputFile: 'playwright-report/results.json' }],
      ]
    : [['html', { outputFolder: 'playwright-report', open: 'on-failure' }]],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    // Default project: `npx playwright test` runs only Chromium to keep PR
    // feedback fast. Cross-browser runs opt in explicitly:
    //   npx playwright test --project=*
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      default: false,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      default: false,
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'node tests/support/static-server.mjs out 3000',
    url: 'http://127.0.0.1:3000/en/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
})
