import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer'

vi.stubGlobal('React', React)

/**
 * Almost every lesson file opens with `# <title>`, and the page template
 * renders the same title as its own `h1`. That gave each lesson two `h1`
 * elements and showed the title twice.
 */
describe('MarkdownRenderer duplicate page title', () => {
  it('drops a leading heading that repeats the page title', () => {
    const { container } = render(
      <MarkdownRenderer
        content={'# Conversational Memory\n\nFirst paragraph.'}
        pageTitle="Conversational Memory"
      />
    )

    expect(container.querySelectorAll('h1')).toHaveLength(0)
    expect(container.textContent).not.toContain('Conversational Memory')
    expect(container.textContent).toContain('First paragraph.')
  })

  it('compares titles ignoring case and extra spaces', () => {
    const { container } = render(
      <MarkdownRenderer content={'#   conversational   MEMORY\n\nBody.'} pageTitle="Conversational Memory" />
    )

    expect(container.querySelectorAll('h1')).toHaveLength(0)
  })

  it('keeps a heading that is genuinely different', () => {
    const { container } = render(
      <MarkdownRenderer content={'# Introduction\n\nBody.'} pageTitle="Conversational Memory" />
    )

    expect(container.querySelector('h1')?.textContent).toBe('Introduction')
  })

  it('keeps the heading when no page title is supplied', () => {
    const { container } = render(<MarkdownRenderer content={'# Introduction\n\nBody.'} />)

    expect(container.querySelector('h1')?.textContent).toBe('Introduction')
  })
})
