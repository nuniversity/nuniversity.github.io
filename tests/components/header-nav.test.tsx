import React from 'react'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import Header from '@/components/layout/Header'
import { Providers } from '@/components/providers/Providers'

vi.stubGlobal('React', React)

const mocks = { pathname: '/en/' }
vi.mock('next/navigation', () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

vi.mock('next/dynamic', () => ({
  default: () => () => null,
}))

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

const dict = {
  navigation: {
    home: 'Home',
    courses: 'Courses',
    tools: 'Tools',
    games: 'Games',
    quizzes: 'Quizzes',
    library: 'Library',
    roadmaps: 'Roadmaps',
    languages: 'Languages',
    about: 'About',
    contact: 'Contact',
    explore: 'Explore',
    explore_hint: 'Discover curated material',
    more: 'More',
  },
  search: { trigger: 'Search', placeholder: 'Search' },
} as any

function renderHeader() {
  return render(
    <Providers>
      <Header lang="en" dict={dict} />
    </Providers>
  )
}

/** The link for a given nav label. */
function link(label: string): HTMLElement {
  return screen.getAllByRole('link', { name: new RegExp(`^${label}$`, 'i') })[0]
}

describe('Header navigation active state', () => {
  beforeEach(() => {
    mocks.pathname = '/en/'
  })

  afterAll(() => {
    vi.unstubAllGlobals()
  })

  it('marks Home active on the home page', () => {
    renderHeader()
    expect(link('Home')).toHaveAttribute('aria-current', 'page')
  })

  it('does NOT keep Home active on a nested page', () => {
    // "/en" is a prefix of every route, so Home must match exactly.
    mocks.pathname = '/en/courses/aws-aif-c01/'
    renderHeader()
    expect(link('Home')).not.toHaveAttribute('aria-current')
  })

  it('does NOT keep Home active deep inside a course', () => {
    mocks.pathname = '/en/courses/aws-aif-c01/01-setup/'
    renderHeader()
    expect(link('Home')).not.toHaveAttribute('aria-current')
  })

  it('marks a section active for its descendant pages', () => {
    mocks.pathname = '/en/courses/aws-aif-c01/'
    renderHeader()
    expect(link('Courses')).toHaveAttribute('aria-current', 'page')
    expect(link('Home')).not.toHaveAttribute('aria-current')
  })

  it('marks the section active on its own listing page', () => {
    mocks.pathname = '/en/tools/'
    renderHeader()
    expect(link('Tools')).toHaveAttribute('aria-current', 'page')
    expect(link('Home')).not.toHaveAttribute('aria-current')
  })

  it('does not mark About active while on Contact', () => {
    mocks.pathname = '/en/contact/'
    renderHeader()
    expect(link('About')).not.toHaveAttribute('aria-current')
    expect(link('Contact')).toHaveAttribute('aria-current', 'page')
  })

  it('keeps Home active when the path has a trailing slash only', () => {
    mocks.pathname = '/en'
    renderHeader()
    expect(link('Home')).toHaveAttribute('aria-current', 'page')
  })
})
