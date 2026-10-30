import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  // Tests use JSX without importing React (automatic runtime, same as Next).
  // Vitest 4 runs on Vite 7 (esbuild); Next's tsconfig uses jsx: "preserve".
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // Coverage instrumentation makes the DOM-heavy tool tests slower than the
    // default 5s; CI was already close to the limit.
    testTimeout: 15_000,
    setupFiles: ['./src/test-setup.ts', './tests/setup/guards.ts'],
    // Keep state from leaking between tests: spies, globals and env stubs are
    // restored automatically instead of relying on each file remembering to.
    restoreMocks: true,
    clearMocks: true,
    unstubGlobals: true,
    unstubEnvs: true,
    exclude: ['node_modules', '.opencode', '.next', 'out', '.husky', 'tests/e2e'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './.coverage',
      // Ratchet, not aspiration: the numbers are the current measured floor,
      // so a change that removes coverage fails even while untested areas are
      // still being filled in. Raise them as suites are added.
      // Recalibrated for Vitest 4 / V8 coverage (it reports more branches and
      // functions than the Vitest 1 measurement these values came from).
      thresholds: {
        lines: 67,
        statements: 67,
        functions: 67,
        branches: 59,
      },
      include: ['lib/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/',
        '.next/',
        'out/',
        'src/test-setup.ts',
        'vitest.config.ts',
        '**/*.{test,spec}.{ts,tsx}',
        '**/types.ts',
        '**/*.d.ts',
        // Worker entrypoint: only runs inside a Worker, never under jsdom.
        'lib/tools/regex.worker.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      // Next resolves this marker at build time; Vitest needs a real module.
      'server-only': path.resolve(__dirname, './tests/support/server-only.ts'),
    },
  },
});
