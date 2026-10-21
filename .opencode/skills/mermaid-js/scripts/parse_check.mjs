#!/usr/bin/env node
// Ground-truth Mermaid parse checker (mermaid-js skill).
// Parses every ```mermaid block with the installed mermaid library (real parser).
// Usage:
//   node parse_check.mjs [--quiet] [glob-or-file ...]   (default: content/courses)
// Exit: 0 = all pass, 1 = parse failures, 2 = tooling error / no files matched.
// --quiet: only print failures + summary.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
const argv = process.argv.slice(2);
const quiet = argv.includes('--quiet');
const args = argv.filter((a) => a !== '--quiet');

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      walk(p, out);
    } else if (e.isFile() && e.name.endsWith('.md')) out.push(p);
  }
  return out;
}

function exists(p) {
  try { statSync(p); return true; } catch { return false; }
}

function expandArgs(argvList) {
  const files = new Set();
  for (const a of argvList) {
    const hasMagic = /[*?[\]]/.test(a);
    if (hasMagic) {
      try {
        const out = execFileSync(
          'git',
          ['ls-files', '--cached', '--others', '--exclude-standard', '--', a],
          { cwd: root, encoding: 'utf8' },
        );
        for (const line of out.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const p = resolve(root, trimmed);
          if (exists(p)) files.add(p);
        }
      } catch {
        const prefix = resolve(root, a.replace(/[*?[\]].*$/, ''));
        for (const f of walk(root)) if (f.startsWith(prefix)) files.add(f);
      }
    } else {
      const p = resolve(root, a);
      if (exists(p)) {
        const st = statSync(p);
        if (st.isDirectory()) for (const f of walk(p)) files.add(f);
        else files.add(p);
      } else if (exists(join(root, a))) {
        files.add(join(root, a));
      }
    }
  }
  return [...files].sort();
}

function extractBlocks(text) {
  const blocks = [];
  const lines = text.split('\n');
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(/^(\s*)```+(\s*)mermaid\s*$/i);
    if (m) {
      const indent = m[1];
      const startLine = i + 1; // 1-based line of the fence open
      const body = [];
      let j = i + 1;
      let closed = false;
      const closeRe = new RegExp('^' + indent.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '```+\\s*$');
      while (j < lines.length) {
        if (closeRe.test(lines[j])) { closed = true; break; }
        body.push(lines[j]);
        j++;
      }
      blocks.push({ startLine, code: body.join('\n'), closed, endLine: closed ? j + 1 : lines.length });
      i = j + 1;
      continue;
    }
    i++;
  }
  return blocks;
}

// Tooling bootstrap — exit 2 (not 1) so callers can distinguish
// "parse failed" from "checker could not run".
let mermaid;
try {
  const { JSDOM } = await import('jsdom');
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { pretendToBeVisual: true });
  for (const k of ['window', 'document', 'navigator', 'Node', 'Element', 'HTMLElement', 'SVGElement', 'DocumentFragment', 'NodeFilter', 'Text', 'Comment', 'DOMParser', 'MutationObserver', 'getComputedStyle', 'CSSStyleSheet', 'customElements']) {
    if (k !== 'window' && !(k in dom.window)) continue;
    try {
      Object.defineProperty(globalThis, k, { value: dom.window[k], configurable: true, writable: true });
    } catch { /* leave as-is */ }
  }
  globalThis.self = dom.window;
  mermaid = (await import('mermaid')).default;
  mermaid.initialize({ startOnLoad: false, suppressErrors: true, securityLevel: 'loose' });
} catch (e) {
  console.error('parse_check tooling error: ' + (e && e.message ? e.message : String(e)));
  process.exit(2);
}

const files = args.length ? expandArgs(args) : walk(join(root, 'content/courses'));
if (!files.length) {
  console.error('No markdown files matched.');
  process.exit(2);
}

let totalFiles = 0, failFiles = 0, totalBlocks = 0, failBlocks = 0;
const failedFiles = [];

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  const blocks = extractBlocks(text);
  if (!blocks.length) continue;
  totalFiles++;
  totalBlocks += blocks.length;
  const failures = [];
  for (const b of blocks) {
    if (!b.closed) { failures.push({ line: b.startLine, err: 'unclosed fence' }); continue; }
    try {
      await mermaid.parse(b.code);
    } catch (e) {
      const raw = (e && (e.str || e.message || String(e))).toString();
      const msg = raw.split('\n').slice(0, 3).join(' ⏎ ').replace(/\s+/g, ' ').slice(0, 300);
      failures.push({ line: b.startLine, err: msg });
    }
  }
  const rel = relative(root, file);
  if (failures.length) {
    failFiles++;
    failBlocks += failures.length;
    failedFiles.push(rel);
    console.log(`FAIL ${rel}`);
    for (const f of failures) console.log(`  line ${f.line}: ${f.err}`);
  } else if (!quiet) {
    console.log(`PASS ${rel} (${blocks.length} block${blocks.length > 1 ? 's' : ''})`);
  }
}

console.log('---');
console.log(`files with mermaid: ${totalFiles}  FAIL files: ${failFiles}`);
console.log(`blocks: ${totalBlocks}  FAIL blocks: ${failBlocks}`);
if (failBlocks) {
  console.log('Failing files:');
  for (const f of failedFiles) console.log('  ' + f);
}
process.exit(failBlocks ? 1 : 0);
