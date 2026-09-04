import { describe, it, expect } from 'vitest';
const { buildArgs, parseArgs } = require('../scripts/run_tests');
const { validateTestFile, validateConfig } = require('../scripts/validate_vitest');

describe('run_tests', () => {
  describe('buildArgs', () => {
    it('returns default args', () => {
      const args = buildArgs({});
      expect(args[0]).toBe('vitest');
      expect(args[1]).toBe('run');
    });

    it('adds file arg', () => {
      const args = buildArgs({ file: 'test.ts' });
      expect(args).toContain('test.ts');
    });

    it('adds coverage', () => {
      const args = buildArgs({ coverage: true });
      expect(args).toContain('--coverage');
    });

    it('adds watch mode', () => {
      const args = buildArgs({ watch: true });
      expect(args).not.toContain('run');
    });

    it('adds test name', () => {
      const args = buildArgs({ testName: 'my test' });
      expect(args).toContain('-t');
      expect(args).toContain('my test');
    });
  });

  describe('parseArgs', () => {
    it('parses --file', () => {
      const flags = parseArgs(['node', 'script.js', '--file', 'test.ts']);
      expect(flags.file).toBe('test.ts');
    });

    it('parses --file=', () => {
      const flags = parseArgs(['node', 'script.js', '--file=test.ts']);
      expect(flags.file).toBe('test.ts');
    });

    it('parses --coverage', () => {
      const flags = parseArgs(['node', 'script.js', '--coverage']);
      expect(flags.coverage).toBe(true);
    });

    it('parses --watch', () => {
      const flags = parseArgs(['node', 'script.js', '--watch']);
      expect(flags.watch).toBe(true);
    });

    it('parses -t', () => {
      const flags = parseArgs(['node', 'script.js', '-t', 'my test']);
      expect(flags.testName).toBe('my test');
    });

    it('parses positional arg as file', () => {
      const flags = parseArgs(['node', 'script.js', 'test.ts']);
      expect(flags.file).toBe('test.ts');
    });
  });
});

describe('validate_vitest', () => {
  describe('validateTestFile', () => {
    it('validates file with tests', () => {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vitest-'));
      const testFile = path.join(tmpDir, 'test.test.ts');
      fs.writeFileSync(testFile, `
        import { describe, it, expect } from 'vitest';
        describe('example', () => {
          it('works', () => {
            expect(true).toBe(true);
          });
        });
      `);

      const errors = validateTestFile(testFile);
      expect(errors).toEqual([]);

      fs.rmSync(tmpDir, { recursive: true });
    });

    it('validates file without tests', () => {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vitest-'));
      const testFile = path.join(tmpDir, 'no-tests.ts');
      fs.writeFileSync(testFile, `
        function helper() {
          return 42;
        }
      `);

      const errors = validateTestFile(testFile);
      expect(errors.length).toBeGreaterThan(0);

      fs.rmSync(tmpDir, { recursive: true });
    });
  });

  describe('validateConfig', () => {
    it('validates config file', () => {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');

      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vitest-'));
      const configFile = path.join(tmpDir, 'vitest.config.ts');
      fs.writeFileSync(configFile, `
        import { defineConfig } from 'vitest/config';
        export default defineConfig({});
      `);

      const errors = validateConfig(configFile);
      expect(errors).toEqual([]);

      fs.rmSync(tmpDir, { recursive: true });
    });
  });
});
