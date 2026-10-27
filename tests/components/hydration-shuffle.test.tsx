import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { render, screen, waitFor } from '@testing-library/react'
import { useMountShuffle } from '@/lib/hooks/use-mount-shuffle'

vi.stubGlobal('React', React)

/**
 * Shuffling during render made the server and client produce different orders,
 * so React reported error #425 and discarded the server HTML on ~294 lesson
 * pages.
 *
 * The contract is: server render and first client render use the source
 * order; the shuffle happens once, after mount.
 */
function Harness({ source }: { source: string[] }) {
  const [items] = useMountShuffle(source, arr => [...arr].reverse())
  return <ul data-testid="list">{items.map(item => <li key={item}>{item}</li>)}</ul>
}

const SOURCE = ['alpha', 'beta', 'gamma']

describe('useMountShuffle', () => {
  it('renders the source order on the server', () => {
    const html = renderToString(<Harness source={SOURCE} />)
    expect(html.indexOf('alpha')).toBeLessThan(html.indexOf('beta'))
    expect(html.indexOf('beta')).toBeLessThan(html.indexOf('gamma'))
  })

  it('is deterministic across server renders', () => {
    expect(renderToString(<Harness source={SOURCE} />)).toBe(
      renderToString(<Harness source={SOURCE} />)
    )
  })

  it('applies the shuffle after mount', async () => {
    render(<Harness source={SOURCE} />)
    await waitFor(() => {
      const items = screen.getAllByRole('listitem').map(li => li.textContent)
      expect(items).toEqual(['gamma', 'beta', 'alpha'])
    })
  })
})
