#!/usr/bin/env node
/**
 * Validate vitest configuration and test files.
 *
 * Exit Codes:
 *   0 - Validation passed
 *   1 - Non-blocking warnings
 *   2 - Blocking errors
 */

const fs = require('fs');
const path = require('path');

function validateTestFile(filePath) {
  const errors = [];

  try {
    const content = fs.readFileSync(filePath, 'utf8');

    const hasTests = /(?:it|test)\s*\(/.test(content);
    const hasDescribe = /describe\s*\(/.test(content);

    if (!hasTests && !hasDescribe) {
      errors.push(`No test functions (it/test) found in ${path.basename(filePath)}`);
    }

    if (hasTests && !/expect\s*\(/.test(content)) {
      errors.push(`Tests found but no assertions (expect) in ${path.basename(filePath)}`);
    }

  } catch (e) {
    errors.push(`Cannot read file: ${e.message}`);
  }

  return errors;
}

function validateConfig(filePath) {
  const errors = [];

  try {
    const content = fs.readFileSync(filePath, 'utf8');

    if (filePath.endsWith('.config.ts') || filePath.endsWith('.config.js')) {
      if (!content.includes('defineConfig') && !content.includes('export default')) {
        errors.push('Config file may not export a valid configuration');
      }
    }

  } catch (e) {
    errors.push(`Cannot read config: ${e.message}`);
  }

  return errors;
}

function validateDir(dirPath) {
  const errors = [];
  const warnings = [];

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      const subErrors = validateDir(fullPath);
      errors.push(...subErrors.errors);
      warnings.push(...subErrors.warnings);
    } else if (entry.isFile()) {
      if (/\.(test|spec)\.(js|ts|jsx|tsx)$/.test(entry.name)) {
        const fileErrors = validateTestFile(fullPath);
        fileErrors.forEach(e => errors.push(`${fullPath}: ${e}`));
      }

      if (/vitest\.config\.(ts|js)$/.test(entry.name) ||
          /vite\.config\.(ts|js)$/.test(entry.name)) {
        const fileErrors = validateConfig(fullPath);
        fileErrors.forEach(e => errors.push(`${fullPath}: ${e}`));
      }
    }
  }

  return { errors, warnings };
}

function main() {
  const args = process.argv.slice(2);
  let target = null;

  for (const arg of args) {
    if (arg.startsWith('--file=')) {
      target = arg.split('=')[1];
    } else if (arg.startsWith('--dir=')) {
      target = arg.split('=')[1];
    } else if (!arg.startsWith('-')) {
      target = arg;
    }
  }

  if (!target) {
    if (fs.existsSync(path.join(process.cwd(), '__tests__'))) {
      target = path.join(process.cwd(), '__tests__');
    } else if (fs.existsSync(path.join(process.cwd(), 'tests'))) {
      target = path.join(process.cwd(), 'tests');
    } else {
      target = process.cwd();
    }
  }

  let errors = [];
  let warnings = [];

  const targetPath = path.resolve(target);

  if (!fs.existsSync(targetPath)) {
    console.error(`ERROR: Target not found: ${target}`, process.stderr);
    process.exit(2);
  }

  const stat = fs.statSync(targetPath);

  if (stat.isFile()) {
    if (/\.(test|spec)\.(js|ts|jsx|tsx)$/.test(path.basename(targetPath))) {
      errors = validateTestFile(targetPath);
    } else if (/vitest\.config\.(ts|js)$/.test(path.basename(targetPath)) ||
               /vite\.config\.(ts|js)$/.test(path.basename(targetPath))) {
      errors = validateConfig(targetPath);
    }
  } else if (stat.isDirectory()) {
    const result = validateDir(targetPath);
    errors = result.errors;
    warnings = result.warnings;
  }

  warnings.forEach(w => console.warn(`VITEST WARNING: ${w}`, process.stderr));

  if (errors.length > 0) {
    errors.forEach(e => console.error(`VITEST ERROR: ${e}`, process.stderr));
    process.exit(2);
  }

  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { validateTestFile, validateConfig, validateDir };
