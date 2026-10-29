import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  // Tests use JSX without importing React (automatic runtime, same as Next).
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    globals: true,
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
      thresholds: {
        lines: 54,
        statements: 54,
        functions: 70,
        branches: 72,
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
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
