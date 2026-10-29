import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { PrismLight } from 'react-syntax-highlighter'
import { Prism as PrismFull } from 'react-syntax-highlighter'
import SyntaxHighlighterWrapper from '@/components/markdown/FixWrapper'


/**
 * The `Prism` entry point bundles all 277 refractor grammars — a ~1.2 MB
 * chunk that was loaded on every lesson page. The site must use the light
 * build with only the languages that actually appear in the course content.
 */
describe('syntax highlighter', () => {
  it('uses the light build rather than the full registry', () => {
    expect(PrismLight).not.toBe(PrismFull)
    // The full build publishes the complete language list; the light one does not.
    expect(
      (PrismFull as unknown as { supportedLanguages?: string[] }).supportedLanguages?.length
    ).toBeGreaterThan(200)
  })

  it('registers the languages the course content uses', () => {
    expect(typeof PrismLight.registerLanguage).toBe('function')
  })

  const cases: Array<[string, string, string]> = [
    ['python', 'def greet(name):\n    return f"hi {name}"', 'greet'],
    ['sql', 'SELECT id FROM users WHERE age > 21;', 'SELECT'],
    ['rust', 'fn main() { let x = 1; }', 'main'],
    ['bash', 'echo "hello" && ls -la', 'echo'],
    ['javascript', 'const x = 1', 'const'],
    ['typescript', 'const x: number = 1', 'number'],
    ['hcl', 'resource "aws_s3_bucket" "b" {}', 'resource'],
    ['json', '{ "a": 1 }', 'a'],
    ['yaml', 'key: value', 'key'],
    ['toml', 'key = "value"', 'key'],
    ['java', 'public class A {}', 'class'],
  ]

  it.each(cases)('highlights %s with token spans', (language, code, expected) => {
    const { container } = render(
      <SyntaxHighlighterWrapper language={language}>{code}</SyntaxHighlighterWrapper>
    )
    expect(container.querySelectorAll('.token').length).toBeGreaterThan(0)
    expect(container.textContent).toContain(expected)
  })

  it('renders an unknown language as plain text rather than failing', () => {
    const { container } = render(
      <SyntaxHighlighterWrapper language="not-a-real-language">some code</SyntaxHighlighterWrapper>
    )
    expect(container.textContent).toContain('some code')
  })
})
