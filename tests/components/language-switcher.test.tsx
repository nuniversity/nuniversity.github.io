import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LanguageSwitcher from '@/components/language/LanguageSwitcher'


const mocks = vi.hoisted(() => ({
  pathname: '/pt/courses/aws-aif-c01',
  push: vi.fn<[string], void>(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ push: mocks.push }),
}))

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    mocks.pathname = '/pt/courses/aws-aif-c01'
    mocks.push.mockClear()
    document.cookie = 'NEXT_LOCALE=; path=/; max-age=0'
  })

  it('renders the current locale label on the toggle', () => {
    render(<LanguageSwitcher currentLocale="pt" />)

    expect(screen.getByRole('button', { name: /Change language/ })).toBeInTheDocument()
    expect(screen.getByText(/🇧🇷/)).toBeInTheDocument()
    expect(screen.getByText(/Português/)).toBeInTheDocument()
  })

  it('opens the dropdown, marks the active locale, and lists all locales', () => {
    render(<LanguageSwitcher currentLocale="pt" />)

    fireEvent.click(screen.getByRole('button', { name: /Change language/ }))

    expect(screen.getByRole('button', { name: /English/ })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /Português/ }).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /Español/ })).toBeInTheDocument()

    const ptOption = screen.getAllByRole('button', { name: /Português/ }).at(-1)!
    const enOption = screen.getByRole('button', { name: /English/ })
    expect(ptOption).toHaveTextContent('✓')
    expect(enOption).not.toHaveTextContent('✓')
  })

  it('navigates to the same path with the swapped locale segment and sets the cookie', () => {
    render(<LanguageSwitcher currentLocale="pt" />)

    fireEvent.click(screen.getByRole('button', { name: /Change language/ }))
    fireEvent.click(screen.getByRole('button', { name: /English/ }))

    expect(mocks.push).toHaveBeenCalledWith('/en/courses/aws-aif-c01')
    expect(document.cookie).toContain('NEXT_LOCALE=en')

    fireEvent.click(screen.getByRole('button', { name: /Change language/ }))
    fireEvent.click(screen.getByRole('button', { name: /Español/ }))

    expect(mocks.push).toHaveBeenCalledWith('/es/courses/aws-aif-c01')
    expect(document.cookie).toContain('NEXT_LOCALE=es')
  })
})
