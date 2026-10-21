import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { describe, expect, it } from 'vitest';

const LIBRARY_DIR = path.join(process.cwd(), 'content', 'library');
const REQUIRED_STRING_FIELDS = ['id', 'title', 'description', 'url', 'category', 'language'];
const PLACEHOLDER_PATTERN = /(localhost|127\.0\.0\.1|example\.(com|org|net)|yourdomain|placeholder|changeme)/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

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

const isValidHttpUrl = (value: string): boolean => {
  if (!/^https?:\/\//i.test(value) || /\s/.test(value)) {
    return false;
  }
  try {
    return new URL(value).hostname.length > 0;
  } catch {
    return false;
  }
};

interface LibraryEntry {
  file: string;
  relative: string;
  locale: string;
  data: Record<string, unknown>;
}

const entries: LibraryEntry[] = walk(LIBRARY_DIR)
  .sort((a, b) => a.localeCompare(b))
  .map((file) => {
    const parsed = matter(fs.readFileSync(file, 'utf8'));
    if (!isRecord(parsed.data)) {
      throw new Error(`${file}: frontmatter must be a YAML object`);
    }
    const relative = path.relative(LIBRARY_DIR, file).split(path.sep).join('/');
    return { file, relative, locale: relative.split('/')[0], data: parsed.data };
  });

describe('content/library frontmatter link hygiene', () => {
  it('enumerates library entries', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  for (const entry of entries) {
    it(`required frontmatter fields: ${entry.relative}`, () => {
      for (const field of REQUIRED_STRING_FIELDS) {
        expect(
          isNonEmptyString(entry.data[field]),
          `${entry.relative}: ${field} must be a non-empty string`,
        ).toBe(true);
      }
      expect(Array.isArray(entry.data.tags), `${entry.relative}: tags must be an array`).toBe(true);
    });

    it(`url is a valid http(s) URL: ${entry.relative}`, () => {
      const url = entry.data.url;
      expect(isNonEmptyString(url), `${entry.relative}: url must be a non-empty string`).toBe(true);
      if (isNonEmptyString(url)) {
        expect(isValidHttpUrl(url), `${entry.relative}: invalid url "${url}"`).toBe(true);
      }
    });

    it(`url has no placeholder host: ${entry.relative}`, () => {
      const url = entry.data.url;
      if (isNonEmptyString(url)) {
        expect(
          PLACEHOLDER_PATTERN.test(url),
          `${entry.relative}: placeholder url "${url}"`,
        ).toBe(false);
      }
    });

    it(`thumbnail is a valid http(s) URL when present: ${entry.relative}`, () => {
      const thumbnail = entry.data.thumbnail;
      if (thumbnail !== undefined) {
        expect(isNonEmptyString(thumbnail), `${entry.relative}: thumbnail must be a string`).toBe(true);
        if (isNonEmptyString(thumbnail)) {
          expect(
            isValidHttpUrl(thumbnail),
            `${entry.relative}: invalid thumbnail "${thumbnail}"`,
          ).toBe(true);
        }
      }
    });

    it(`language matches locale directory: ${entry.relative}`, () => {
      expect(entry.data.language).toBe(entry.locale);
    });
  }

  it('entry ids are unique across the library', () => {
    const ids = entries.map((entry) => entry.data.id);
    const unique = new Set(ids.filter((id): id is string => typeof id === 'string'));
    expect(unique.size).toBe(ids.length);
  });
});

const EXCEPTIONS_PATH = path.join(process.cwd(), 'content', 'library', 'link-exceptions.tsv');

interface ExceptionRow {
  file: string;
  url: string;
  reason: string;
}

const loadExceptions = (): ExceptionRow[] => {
  const raw = fs.readFileSync(EXCEPTIONS_PATH, 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = raw.split('\n').filter((line) => line.trim().length > 0);
  return lines.slice(1).map((line) => {
    const [file, url, ...rest] = line.split('\t');
    return { file, url, reason: rest.join('\t') };
  });
};

describe('library link curation rules', () => {
  const exceptions = loadExceptions();
  const exceptionFiles = new Set(exceptions.map((row) => row.file));
  const exceptionUrls = new Set(exceptions.map((row) => row.url));
  const repoRelative = (entry: LibraryEntry) => `content/library/${entry.relative}`;
  const frontmatterByRepoPath = new Map(
    entries.map((entry) => [repoRelative(entry), entry.data] as const),
  );

  it('exceptions ledger has rows with file, url and reason', () => {
    expect(exceptions.length).toBeGreaterThan(0);
    for (const row of exceptions) {
      expect(isNonEmptyString(row.file), `bad row file: ${JSON.stringify(row)}`).toBe(true);
      expect(isNonEmptyString(row.url), `bad row url: ${JSON.stringify(row)}`).toBe(true);
      expect(isNonEmptyString(row.reason), `bad row reason: ${JSON.stringify(row)}`).toBe(true);
    }
  });

  it('every url is https-only unless the file is listed in exceptions', () => {
    for (const entry of entries) {
      const url = entry.data.url;
      if (!isNonEmptyString(url)) continue;
      if (exceptionFiles.has(repoRelative(entry))) continue;
      expect(
        url.startsWith('https://'),
        `${entry.relative}: http(s) url "${url}" must be https or listed in link-exceptions.tsv`,
      ).toBe(true);
    }
  });

  it('exact-duplicate urls across files are listed in exceptions', () => {
    const byUrl = new Map<string, string[]>();
    for (const entry of entries) {
      const url = entry.data.url;
      if (!isNonEmptyString(url)) continue;
      const files = byUrl.get(url) ?? [];
      files.push(entry.relative);
      byUrl.set(url, files);
    }
    byUrl.forEach((files, url) => {
      if (files.length < 2) return;
      expect(
        exceptionUrls.has(url),
        `duplicate url "${url}" in ${files.join(', ')} must appear in link-exceptions.tsv`,
      ).toBe(true);
    });
  });

  it('bare-host urls are listed in exceptions', () => {
    for (const entry of entries) {
      const url = entry.data.url;
      if (!isNonEmptyString(url)) continue;
      let pathname: string;
      try {
        pathname = new URL(url).pathname;
      } catch {
        continue;
      }
      if (pathname !== '/' && pathname !== '') continue;
      expect(
        exceptionUrls.has(url),
        `bare-host url "${url}" (${entry.relative}) must appear in link-exceptions.tsv`,
      ).toBe(true);
    }
  });

  it('exceptions rows reference existing files with matching frontmatter url', () => {
    for (const row of exceptions) {
      expect(
        frontmatterByRepoPath.has(row.file),
        `${row.file}: listed in link-exceptions.tsv but not found in content/library`,
      ).toBe(true);
      const data = frontmatterByRepoPath.get(row.file);
      if (data) {
        expect(
          data.url,
          `${row.file}: exceptions url "${row.url}" does not match frontmatter url "${String(data.url)}"`,
        ).toBe(row.url);
      }
    }
  });
});
