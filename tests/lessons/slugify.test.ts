import { describe, expect, it } from 'vitest'
import { slugifyHeading } from '@/lib/lessons/slugify'

describe('slugifyHeading', () => {
  it('lowercases and hyphenates plain text', () => {
    expect(slugifyHeading('AWS EC2 Basics')).toBe('aws-ec2-basics')
  })

  it('strips accents via NFD decomposition', () => {
    expect(slugifyHeading('Avaliação de Riscos')).toBe('avaliacao-de-riscos')
    expect(slugifyHeading('Não pontuados')).toBe('nao-pontuados')
    expect(slugifyHeading('Café')).toBe('cafe')
  })

  it('collapses punctuation and symbols into single hyphens', () => {
    expect(slugifyHeading('Hello, World!')).toBe('hello-world')
    expect(slugifyHeading('What is 2 + 2?')).toBe('what-is-2-2')
    expect(slugifyHeading('section/with/slashes')).toBe('section-with-slashes')
  })

  it('trims leading and trailing separators', () => {
    expect(slugifyHeading('  --Intro--  ')).toBe('intro')
  })

  it('returns an empty string for headings with no slug characters', () => {
    expect(slugifyHeading('!!!')).toBe('')
    expect(slugifyHeading('')).toBe('')
  })

  it('keeps digits and internal hyphens', () => {
    expect(slugifyHeading('IAM-2024 Policy')).toBe('iam-2024-policy')
  })
})
