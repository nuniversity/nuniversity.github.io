import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import matter from 'gray-matter';
import { describe, expect, it } from 'vitest';

const live = !!process.env.LIVE_LINKS;

const LIBRARY_DIR = path.join(process.cwd(), 'content', 'library');
const EXCEPTIONS_PATH = path.join(process.cwd(), 'content', 'library', 'link-exceptions.tsv');
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const walk = (dir: string, out: string[] = []): string[] => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, out);
    } else if (entry.name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
};

interface LiveEntry {
  file: string;
  relative: string;
  url: string;
}

const entries: LiveEntry[] = walk(LIBRARY_DIR)
  .sort((a, b) => a.localeCompare(b))
  .flatMap((file) => {
    const parsed = matter(fs.readFileSync(file, 'utf8'));
    if (!isRecord(parsed.data)) {
      throw new Error(`${file}: frontmatter must be a YAML object`);
    }
    // Analysis companions are internal pages, not external links.
    if (parsed.data.type === 'analysis') return [];
    const relative = path.relative(LIBRARY_DIR, file).split(path.sep).join('/');
    const url = parsed.data.url;
    if (typeof url !== 'string' || url.trim().length === 0) {
      throw new Error(`${relative}: url must be a non-empty string`);
    }
    return [{ file, relative, url }];
  });

const loadExceptionUrls = (): Set<string> => {
  const raw = fs.readFileSync(EXCEPTIONS_PATH, 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = raw.split('\n').filter((line) => line.trim().length > 0);
  const urls = new Set<string>();
  for (const line of lines.slice(1)) {
    const [, url] = line.split('\t');
    if (url) urls.add(url);
  }
  return urls;
};

const curlStatus = (url: string): string => {
  try {
    return execFileSync(
      'curl',
      ['-sS', '-o', '/dev/null', '-w', '%{http_code}', '-L', '--max-time', '20', '-A', USER_AGENT, url],
      { encoding: 'utf8' },
    ).trim();
  } catch {
    return '000';
  }
};

describe.skipIf(!live)('library live link check', () => {
  const exceptionUrls = loadExceptionUrls();
  const statusCache = new Map<string, string>();

  const statusOf = (url: string): string => {
    const cached = statusCache.get(url);
    if (cached !== undefined) return cached;
    const status = curlStatus(url);
    statusCache.set(url, status);
    return status;
  };

  for (const entry of entries) {
    it(`live url responds 200/301: ${entry.relative}`, () => {
      const status = statusOf(entry.url);
      if (status === '200' || status === '301') return;
      expect(
        exceptionUrls.has(entry.url),
        `${entry.relative}: live status ${status} for "${entry.url}" — add to link-exceptions.tsv or fix the url`,
      ).toBe(true);
    });
  }
});
