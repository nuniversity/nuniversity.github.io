#!/usr/bin/env node
/**
 * Run vitest with standard configuration.
 *
 * Exit Codes:
 *   0 - All tests passed
 *   1 - One or more tests failed
 *   2 - vitest error (not test failures)
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function buildArgs(flags) {
  const args = ['vitest', 'run'];

  if (flags.file) {
    args.push(flags.file);
  }

  if (flags.watch) {
    args.pop(); // remove 'run'
  }

  if (flags.coverage) {
    args.push('--coverage');
  }

  if (flags.testName) {
    args.push('-t', flags.testName);
  }

  if (flags.reporter) {
    args.push('--reporter', flags.reporter);
  }

  if (flags.ui) {
    args.push('--ui');
  }

  return args;
}

function parseArgs(argv) {
  const flags = {};
  let i = 2; // skip node and script name

  while (i < argv.length) {
    const arg = argv[i];

    if (arg === '--file' || arg.startsWith('--file=')) {
      flags.file = arg.includes('=') ? arg.split('=')[1] : argv[++i];
    } else if (arg === '--watch' || arg === '-w') {
      flags.watch = true;
    } else if (arg === '--coverage') {
      flags.coverage = true;
    } else if (arg === '--test-name' || arg === '-t') {
      flags.testName = arg.includes('=') ? arg.split('=')[1] : argv[++i];
    } else if (arg === '--reporter') {
      flags.reporter = argv[++i];
    } else if (arg === '--ui') {
      flags.ui = true;
    } else if (!arg.startsWith('-')) {
      flags.file = arg;
    }

    i++;
  }

  return flags;
}

function main() {
  const cwd = process.cwd();

  if (!fs.existsSync(path.join(cwd, 'vitest.config.ts')) &&
      !fs.existsSync(path.join(cwd, 'vitest.config.js')) &&
      !fs.existsSync(path.join(cwd, 'vite.config.ts')) &&
      !fs.existsSync(path.join(cwd, 'vite.config.js'))) {
    if (!fs.existsSync(path.join(cwd, 'package.json')) ||
        !fs.readFileSync(path.join(cwd, 'package.json'), 'utf8').includes('vitest')) {
      console.error('ERROR: No vitest project detected', process.stderr);
      process.exit(2);
    }
  }

  const flags = parseArgs(process.argv);
  const args = buildArgs(flags);
  const cmd = args.join(' ');

  console.error(`Running: ${cmd}`);

  try {
    execSync(cmd, { cwd, stdio: 'inherit' });
    process.exit(0);
  } catch (e) {
    process.exit(e.status || 1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { buildArgs, parseArgs };
