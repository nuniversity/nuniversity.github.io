import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const DICTIONARY_DIR = path.join(process.cwd(), 'dictionaries');
const REFERENCE_LOCALE = 'en';
const COMPARED_LOCALES = ['pt', 'es'];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const flattenInto = (value: Record<string, unknown>, prefix: string, out: Set<string>): void => {
  for (const [key, child] of Object.entries(value)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (isRecord(child)) {
      flattenInto(child, full, out);
    } else {
      out.add(full);
    }
  }
};

const leafKeysOf = (locale: string): Set<string> => {
  const source = fs.readFileSync(path.join(DICTIONARY_DIR, `${locale}.json`), 'utf8');
  const parsed: unknown = JSON.parse(source);
  if (!isRecord(parsed)) {
    throw new Error(`${locale}.json must be a JSON object`);
  }
  const keys = new Set<string>();
  flattenInto(parsed, '', keys);
  return keys;
};

const difference = (left: Set<string>, right: Set<string>): string[] =>
  Array.from(left)
    .filter((key) => !right.has(key))
    .sort((a, b) => a.localeCompare(b));

const referenceKeys = leafKeysOf(REFERENCE_LOCALE);
const comparedKeys: Record<string, Set<string>> = {};
for (const locale of COMPARED_LOCALES) {
  comparedKeys[locale] = leafKeysOf(locale);
}

describe('dictionaries leaf-path parity', () => {
  it('reference dictionary exposes leaf keys', () => {
    expect(referenceKeys.size).toBeGreaterThan(0);
  });

  for (const locale of COMPARED_LOCALES) {
    it(`leaf keys in ${REFERENCE_LOCALE} missing from ${locale}`, () => {
      expect(difference(referenceKeys, comparedKeys[locale])).toEqual([]);
    });

    it(`orphan leaf keys in ${locale} not in ${REFERENCE_LOCALE}`, () => {
      expect(difference(comparedKeys[locale], referenceKeys)).toEqual([]);
    });
  }
});
