import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer'


describe('MarkdownRenderer sanitization', () => {
  it('strips script tags together with their content', () => {
    const { container } = render(
      <MarkdownRenderer content={'Intro\n\n<script>window.__pwned = true</script>\n\nOutro'} />
    )

    expect(container.querySelector('script')).toBeNull()
    expect(container.textContent).not.toContain('window.__pwned')
    expect((window as unknown as { __pwned?: boolean }).__pwned).toBeUndefined()
    expect(container.textContent).toContain('Intro')
  })

  it('strips inline event handlers from raw images', () => {
    const { container } = render(
      <MarkdownRenderer content={'<img src="/images/a.png" onerror="window.__img = 1" alt="Diagram">'} />
    )

    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img?.getAttribute('alt')).toBe('Diagram')
    expect(img?.getAttribute('onerror')).toBeNull()
    expect((img as HTMLImageElement).onerror).toBeNull()
    expect((window as unknown as { __img?: boolean }).__img).toBeUndefined()
  })

  it('removes javascript: hrefs from raw anchors and markdown links', () => {
    const { container } = render(
      <MarkdownRenderer content={'<a href="javascript:alert(1)">raw</a>\n\n[md](javascript:alert(2))'} />
    )

    const hrefs = Array.from(container.querySelectorAll('a')).map(anchor =>
      anchor.getAttribute('href')
    )
    expect(hrefs.some(href => href?.toLowerCase().startsWith('javascript'))).toBe(false)
    expect(hrefs.some(href => href?.includes('alert'))).toBe(false)
  })

  it('keeps generated callouts with classes, label and body', () => {
    const { container } = render(<MarkdownRenderer content={'> [!WARNING]\n> Careful with traps'} />)

    expect(container.querySelector('div.callout.callout-warning')).not.toBeNull()
    expect(container.querySelector('.callout-label')?.textContent).toBe('Warning')
    expect(container.querySelector('.callout-body')?.textContent).toContain('Careful with traps')
    expect(container.querySelector('.callout-icon')).not.toBeNull()
  })

  it('keeps details/summary disclosures with markdown inside', () => {
    const { container } = render(
      <MarkdownRenderer content={'<details>\n<summary>More detail</summary>\n\nHidden **bold** bits\n</details>'} />
    )

    expect(container.querySelector('details')).not.toBeNull()
    expect(container.querySelector('summary')?.textContent).toBe('More detail')
    expect(container.querySelector('details strong')?.textContent).toBe('bold')
  })

  it('keeps math through sanitize so KaTeX renders it', async () => {
    const { container } = render(
      <MarkdownRenderer content={'Inline $E=mc^2$ math.\n\n$$F = ma$$'} />
    )

    await waitFor(
      () => {
        expect(container.querySelectorAll('.katex').length).toBeGreaterThanOrEqual(2)
      },
      { timeout: 3000 }
    )
    expect(container.textContent).not.toContain('$$')
  })

  it('assigns heading ids after sanitization', () => {
    const { container } = render(<MarkdownRenderer content={'## Memória Episódica'} />)

    expect(container.querySelector('h2')?.getAttribute('id')).toBe('memoria-episodica')
  })

  it('keeps cite[index] and kbd from content', () => {
    const { container } = render(
      <MarkdownRenderer content={'Press <kbd>Ctrl</kbd>+K. See <cite index="96-1">Ref 96</cite>.'} />
    )

    expect(container.querySelector('kbd')?.textContent).toBe('Ctrl')
    const cite = container.querySelector('cite')
    expect(cite?.getAttribute('index')).toBe('96-1')
    expect(cite?.textContent).toBe('Ref 96')
  })

  it('keeps interactive code fences dispatching after sanitize', () => {
    const config = JSON.stringify({
      type: 'fillblank',
      title: 'Sanitize survives',
      instructions: 'Type the numbers.',
      items: [{ prompt: 'Exam duration: ______ minutes', answer: '130' }],
    })
    const { container } = render(
      <MarkdownRenderer content={`\`\`\`interactive\n${config}\n\`\`\``} />
    )

    expect(container.textContent).toContain('Sanitize survives')
    expect(screen.getAllByRole('textbox').length).toBeGreaterThan(0)
    expect(container.querySelector('pre code.language-interactive')).toBeNull()
  })
})
