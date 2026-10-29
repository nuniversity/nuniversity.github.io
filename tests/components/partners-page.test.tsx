import { describe, expect, it, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import PartnersPage from '@/components/partners/PartnersPage'
import en from '@/dictionaries/en.json'


vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@formspree/react', () => ({
  useForm: () => [{ succeeded: false, submitting: false, errors: [] }, vi.fn()],
  ValidationError: () => null,
}))

/**
 * framer-motion's `whileInView` needs IntersectionObserver, which jsdom
 * does not implement. A minimal stub is enough — the animations only need
 * the observer to exist (same approach as lesson-outline.test.tsx).
 */
class MockIntersectionObserver {
  constructor(
    public callback: (entries: { target: Element; isIntersecting: boolean }[], observer: MockIntersectionObserver) => void
  ) {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

beforeAll(() => {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
})

describe('PartnersPage', () => {
  it('renders the partner directory with the featured partner', () => {
    render(<PartnersPage lang="en" dict={en as any} />)

    expect(screen.getAllByText('Meet Our Partners').length).toBeGreaterThan(0)
    expect(screen.getByText('Mímir Software Factory')).toBeInTheDocument()
    expect(screen.getByText('Founding Partner')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Mímir Software Factory on LinkedIn/i })
    ).toHaveAttribute('href', 'https://www.linkedin.com/company/mimir-software-factory/')
    expect(
      screen.getByRole('link', { name: /Mímir Software Factory on GitHub/i })
    ).toHaveAttribute('href', 'https://github.com/mimir-software-factory')
  })

  it('renders the partnership inquiry form', () => {
    render(<PartnersPage lang="en" dict={en as any} />)

    // The hero CTA and the form heading share the same copy.
    expect(screen.getAllByText('Become a Partner').length).toBeGreaterThan(0)
    expect(screen.getByLabelText('Organization *')).toBeInTheDocument()
    expect(screen.getByLabelText('Partnership type *')).toBeInTheDocument()
  })

  it('keeps the honeypot out of the accessibility tree', () => {
    render(<PartnersPage lang="en" dict={en as any} />)

    const honeypot = document.getElementById('partner-url')
    expect(honeypot).not.toBeNull()
    expect(honeypot!.closest('div')).toHaveAttribute('aria-hidden', 'true')
  })
})
