import { afterAll, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatCounter from '@/components/home/StatCounter'


describe('StatCounter', () => {
  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('renders the numeric part and keeps the suffix', () => {
    render(<StatCounter value="49+" />)
    expect(screen.getByText('49+')).toBeInTheDocument()
  })

  it('renders a value with no suffix', () => {
    render(<StatCounter value="117" />)
    expect(screen.getByText('117')).toBeInTheDocument()
  })

  it('handles a non-numeric value without crashing', () => {
    render(<StatCounter value="many" />)
    expect(screen.getByText('many')).toBeInTheDocument()
  })

  it('formats thousands separators', () => {
    render(<StatCounter value="1,234+" />)
    expect(screen.getByText('1,234+')).toBeInTheDocument()
  })
})
