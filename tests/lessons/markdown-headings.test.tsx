import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer'


function headingIds(container: HTMLElement): (string | null)[] {
  return Array.from(container.querySelectorAll('h2, h3')).map(el => el.getAttribute('id'))
}

describe('MarkdownRenderer heading ids', () => {
  it('assigns ids to h2 and h3 headings', () => {
    const { container } = render(<MarkdownRenderer content={'## Getting Started\n\n### Prerequisites'} />)

    expect(headingIds(container)).toEqual(['getting-started', 'prerequisites'])
  })

  it('deduplicates repeated headings', () => {
    const { container } = render(<MarkdownRenderer content={'## Summary\n\n## Summary'} />)

    expect(headingIds(container)).toEqual(['summary', 'summary-2'])
  })

  it('slugifies accented headings', () => {
    const { container } = render(<MarkdownRenderer content={'## Avaliação de Riscos'} />)

    expect(headingIds(container)).toEqual(['avaliacao-de-riscos'])
  })

  it('leaves h1 without an id', () => {
    const { container } = render(<MarkdownRenderer content={'# Title\n\n## Section'} />)

    const h1 = container.querySelector('h1')
    expect(h1?.getAttribute('id')).toBeNull()
    expect(headingIds(container)).toEqual(['section'])
  })

  it('applies scroll offset classes for anchor targets', () => {
    const { container } = render(<MarkdownRenderer content={'## Section'} />)

    expect(container.querySelector('h2')?.className).toContain('scroll-mt-24')
  })
})
