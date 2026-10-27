import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer'

vi.stubGlobal('React', React)

/**
 * Course prose writes money as `US$ 499.999` / `R$ 1.000`. remark-math reads
 * two `$` on one line as an inline math span, so the amount was rendered as
 * KaTeX and the bold markers around it leaked out as literal asterisks.
 */
describe('MarkdownRenderer currency', () => {
  it('keeps two currency amounts as text, not math', () => {
    const { container } = render(
      <MarkdownRenderer
        content={'Custa **US$ 499.999**, mais **US$ 400** de inscrição e **US$ 1.000** por ano.'}
      />
    )

    expect(container.querySelector('.katex')).toBeNull()
    expect(container.textContent).toContain('US$ 499.999')
    expect(container.textContent).toContain('US$ 400')
    expect(container.querySelectorAll('strong')).toHaveLength(3)
  })

  it('keeps an escaped reference amount as text', () => {
    const { container } = render(<MarkdownRenderer content={'Um investimento de R\\$ 10.000 a 6% ao ano.'} />)

    expect(container.querySelector('.katex')).toBeNull()
    expect(container.textContent).toContain('R$ 10.000')
  })

  it('still renders genuine inline math', () => {
    const { container } = render(<MarkdownRenderer content={'A derivada é $3x^2$ e a potência $5^3$.'} />)

    expect(container.querySelectorAll('.katex').length).toBeGreaterThan(0)
  })

  it('does not touch dollars inside fenced code', () => {
    const content = ['```bash', 'echo "US$ 400 and US$ 500"', '```'].join('\n')
    const { container } = render(<MarkdownRenderer content={content} />)

    expect(container.textContent).toContain('US$ 400 and US$ 500')
    expect(container.textContent).not.toContain('\\$')
  })

  it('does not touch dollars inside inline code', () => {
    const { container } = render(<MarkdownRenderer content={'Use `US$ 400` as the key.'} />)

    expect(container.querySelector('.katex')).toBeNull()
    expect(container.querySelector('code')?.textContent).toBe('US$ 400')
  })

  it('keeps a priced table row intact', () => {
    const content = [
      '| Mode | Cost |',
      '| --- | --- |',
      '| **Provisioned** | $0.015 por shard-hour (**$0.36/dia/shard**) + $0.014 por milhão |',
    ].join('\n')

    const { container } = render(<MarkdownRenderer content={content} />)

    expect(container.querySelector('.katex')).toBeNull()
    expect(container.textContent).toContain('$0.015 por shard-hour')
    expect(container.textContent).toContain('$0.36/dia/shard')
    expect(container.querySelectorAll('strong')).toHaveLength(2)
  })

  it('keeps a price range as text', () => {
    const { container } = render(
      <MarkdownRenderer content={'O custo fica em ~$0.50-$1.00 por hora, dependendo da região.'} />
    )

    expect(container.querySelector('.katex')).toBeNull()
    expect(container.textContent).toContain('$0.50-$1.00')
  })
})
