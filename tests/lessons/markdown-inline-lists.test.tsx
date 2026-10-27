import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer'

vi.stubGlobal('React', React)

/**
 * Several courses list 30–40 service names on one line separated by `·`.
 * Rendered literally that is an unreadable wall of text, so the renderer
 * rewrites such runs into bullet lists.
 */
describe('MarkdownRenderer inline middle-dot lists', () => {
  const longRun =
    'Amazon AppFlow · AWS Clean Rooms · AWS Data Exchange · Amazon DataZone · Amazon MSK · AWS AppFabric · Amazon WorkDocs.'

  it('turns a long middle-dot run into a bullet list', () => {
    const { container } = render(<MarkdownRenderer content={longRun} />)

    const items = Array.from(container.querySelectorAll('li')).map(li => li.textContent?.trim())
    expect(items).toEqual([
      'Amazon AppFlow',
      'AWS Clean Rooms',
      'AWS Data Exchange',
      'Amazon DataZone',
      'Amazon MSK',
      'AWS AppFabric',
      'Amazon WorkDocs',
    ])
  })

  it('keeps a lead-in label as its own paragraph', () => {
    const { container } = render(
      <MarkdownRenderer content={'**Query federation (11):** MySQL · PostgreSQL · Teradata · Oracle · Amazon Redshift'} />
    )

    expect(container.querySelector('p')?.textContent?.trim()).toBe('Query federation (11):')
    expect(container.querySelectorAll('li')).toHaveLength(5)
  })

  it('leaves short runs of two or three middle dots alone', () => {
    const { container } = render(<MarkdownRenderer content={'Alpha · Beta · Gamma'} />)

    expect(container.querySelectorAll('li')).toHaveLength(0)
    expect(container.textContent).toContain('Alpha · Beta · Gamma')
  })

  it('does not rewrite middle dots inside fenced code', () => {
    const content = ['```text', longRun, '```'].join('\n')
    const { container } = render(<MarkdownRenderer content={content} />)

    expect(container.querySelectorAll('li')).toHaveLength(0)
    expect(container.querySelector('code')?.textContent).toContain('Amazon AppFlow · AWS Clean Rooms')
  })

  it('does not rewrite middle dots inside a table cell', () => {
    const content = ['| Service | Examples |', '| --- | --- |', `| Analytics | ${longRun} |`].join('\n')
    const { container } = render(<MarkdownRenderer content={content} />)

    expect(container.querySelectorAll('table li')).toHaveLength(0)
    expect(container.querySelectorAll('td')[1]?.textContent).toContain('Amazon AppFlow')
  })

  it('does not rewrite middle dots inside a list item', () => {
    const content = `- Legacy note: ${longRun}`
    const { container } = render(<MarkdownRenderer content={content} />)

    expect(container.querySelectorAll('ul > li')).toHaveLength(1)
  })

  it('converts a run whose label is longer than an item', () => {
    const content =
      '**Out-of-scope services that look in-scope (never the correct answer):** Amazon AppFlow · AWS Clean Rooms · AWS Data Exchange · Amazon DataZone · Amazon MSK'
    const { container } = render(<MarkdownRenderer content={content} />)

    expect(container.querySelector('p')?.textContent?.trim()).toBe(
      'Out-of-scope services that look in-scope (never the correct answer):'
    )
    expect(container.querySelectorAll('li')).toHaveLength(5)
  })

  it('strips a bold marker that was split across items', () => {
    const content =
      'O elenco atual da AWS é de **quatro planos**: **Basic · Business Support+ · Enterprise Support · Unified Operations**.'
    const { container } = render(<MarkdownRenderer content={content} />)

    const items = Array.from(container.querySelectorAll('li')).map(li => li.textContent?.trim())
    expect(items[0]).toBe('Basic')
    expect(items[items.length - 1]).toBe('Unified Operations')
    expect(container.textContent).not.toContain('**')
  })

  it('keeps a trailing sentence that follows the last item', () => {
    const content =
      '**Option letters:** **a** = AMD · **g** = Graviton · **i** = Intel · **d** = instance store · **n** = network optimized · **z** = high CPU frequency. After the dash comes the size, which is the only part of the name that is not an option flag.'
    const { container } = render(<MarkdownRenderer content={content} />)

    expect(container.querySelectorAll('li')).toHaveLength(6)
    const paragraphs = Array.from(container.querySelectorAll('p')).map(p => p.textContent?.trim())
    expect(paragraphs).toContain(
      'After the dash comes the size, which is the only part of the name that is not an option flag.'
    )
  })
})
