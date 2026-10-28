import { defineConfig } from 'vitest/config'
import path from 'path'

// Artifact integration tests: validate the BUILT static export in `out/`
// (no browser, no jsdom — pure Node). Requires a fresh build first:
//   npm run build && npm run test:artifact
//
// Deliberately separate from the main vitest.config.ts so that `npm test`
// (jsdom unit/component tests) stays fast and does not silently pass when
// out/ is stale.
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/artifact/**/*.test.mjs'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})
