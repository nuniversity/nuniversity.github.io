import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const COURSES_DIR = path.join(process.cwd(), 'content', 'courses');
const VALID_LOCALES = ['en', 'pt', 'es'];
const LESSON_FILE_PATTERN = /^(\d+)-([a-z0-9]+(-[a-z0-9]+)*)\.md$/;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const courseSlugs: string[] = fs
  .readdirSync(COURSES_DIR, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
  .map((entry) => entry.name)
  .sort((a, b) => a.localeCompare(b));

const readCourseJson = (slug: string): Record<string, unknown> => {
  const source = fs.readFileSync(path.join(COURSES_DIR, slug, 'course.json'), 'utf8');
  const parsed: unknown = JSON.parse(source);
  if (!isRecord(parsed)) {
    throw new Error(`${slug}: course.json must be a JSON object`);
  }
  return parsed;
};

const localesOf = (slug: string): string[] =>
  VALID_LOCALES.filter((locale) => fs.existsSync(path.join(COURSES_DIR, slug, locale)));

const lessonNamesOf = (slug: string, locale: string): string[] =>
  fs
    .readdirSync(path.join(COURSES_DIR, slug, locale), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name);

const numberedLessonsOf = (slug: string, locale: string): RegExpExecArray[] =>
  lessonNamesOf(slug, locale)
    .map((name) => LESSON_FILE_PATTERN.exec(name))
    .filter((match): match is RegExpExecArray => match !== null)
    .sort((a, b) => Number.parseInt(a[1], 10) - Number.parseInt(b[1], 10));

describe('content/courses structural integrity', () => {
  it('discovers a non-empty course corpus', () => {
    expect(courseSlugs.length).toBeGreaterThan(0);
  });

  describe('course.json well-formed', () => {
    for (const slug of courseSlugs) {
      it(`course.json well-formed: ${slug}`, () => {
        const data = readCourseJson(slug);
        expect(isNonEmptyString(data.area), 'area must be a non-empty string').toBe(true);
        expect(typeof data.author, 'author must be a string').toBe('string');
        expect(isRecord(data.en), 'en must be an object').toBe(true);
        if (isRecord(data.en)) {
          expect(isNonEmptyString(data.en.title), 'en.title must be a non-empty string').toBe(true);
          expect(isNonEmptyString(data.en.description), 'en.description must be a non-empty string').toBe(
            true,
          );
        }
      });
    }
  });

  describe('locale directory coverage', () => {
    for (const slug of courseSlugs) {
      it(`locale coverage: ${slug}`, () => {
        expect(localesOf(slug).length).toBeGreaterThanOrEqual(1);
      });
    }
  });

  describe('lesson naming and sequential orders', () => {
    for (const slug of courseSlugs) {
      for (const locale of localesOf(slug)) {
        it(`lesson naming/orders: ${slug} (${locale})`, () => {
          const names = lessonNamesOf(slug, locale);
          expect(names.length, 'locale directory must contain lesson files').toBeGreaterThan(0);
          const orders: number[] = [];
          for (const name of names) {
            const match = LESSON_FILE_PATTERN.exec(name);
            expect(match, `invalid lesson naming: ${name}`).not.toBeNull();
            if (match) {
              orders.push(Number.parseInt(match[1], 10));
            }
          }
          orders.sort((a, b) => a - b);
          expect(orders).toEqual(orders.map((_, index) => index + 1));
        });

        it(`first lesson resolvable: ${slug} (${locale})`, () => {
          const lessons = numberedLessonsOf(slug, locale);
          expect(lessons.length, 'at least one lesson file must exist').toBeGreaterThan(0);
          const first = lessons[0];
          expect(first, 'no lesson file matches the naming pattern').toBeDefined();
          if (first) {
            expect(first[2].length).toBeGreaterThan(0);
          }
        });
      }
    }
  });
});
