import { defineConfig, devices } from '@playwright/test'

// Tests run against the BUILT static export in `out/`, served by a local
// static server that mirrors GitHub Pages semantics (trailing-slash
// redirects, 404.html fallback). The build must exist before running:
//   npm run build && npm run test:e2e
// In CI the workflow builds first, so the same artifact that gets deployed
// is the one under test.
//
// The server is always started fresh by default: reusing whatever happens to
// be listening on the port is how a stale build silently passes the suite.
// Opt in explicitly with E2E_REUSE_SERVER=1.

const PORT = Number(process.env.E2E_PORT || 4310)
const BASE_URL = process.env.E2E_BASE_URL || `http://127.0.0.1:${PORT}`
const EXTERNAL_SERVER = Boolean(process.env.E2E_BASE_URL)

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
    baseURL: BASE_URL,
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
      name: 'mobile-chrome',
      default: false,
      use: { ...devices['Pixel 7'] },
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
  webServer: EXTERNAL_SERVER
    ? undefined
    : {
        command: `node tests/support/static-server.mjs out ${PORT}`,
        url: `${BASE_URL}/en/`,
        reuseExistingServer: process.env.E2E_REUSE_SERVER === '1',
        timeout: 30_000,
      },
})
