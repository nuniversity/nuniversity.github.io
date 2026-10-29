import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import Header from '@/components/layout/Header'
import { Providers } from '@/components/providers/Providers'


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
    partners: 'Partners',
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
  // Links inside the Explore panel also carry a hint, so the accessible name
  // is "Tools Interactive productivity tools" rather than just "Tools".
  return screen.getAllByRole('link', { name: new RegExp(`^${label}\\b`, 'i') })[0]
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
    // Tools lives inside the Explore panel, so it has to be opened first.
    fireEvent.click(screen.getByRole('button', { name: /Explore/i }))
    expect(link('Tools')).toHaveAttribute('aria-current', 'page')
    expect(link('Home')).not.toHaveAttribute('aria-current')
  })

  it('keeps the top bar short and moves the rest into Explore', () => {
    renderHeader()
    // Only Home and Courses are always visible.
    expect(link('Home')).toBeInTheDocument()
    expect(link('Courses')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^Tools$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^Games$/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Explore/i }))
    for (const label of ['Tools', 'Games', 'Quizzes', 'Library', 'Roadmaps', 'Languages']) {
      expect(link(label)).toBeInTheDocument()
    }
  })

  it('does not mark About active while on Contact', () => {
    mocks.pathname = '/en/contact/'
    renderHeader()
    expect(link('About')).not.toHaveAttribute('aria-current')
    expect(link('Contact')).toHaveAttribute('aria-current', 'page')
  })

  it('renders the Partners link as a site page', () => {
    mocks.pathname = '/en/partners/'
    renderHeader()
    expect(link('Partners')).toHaveAttribute('href', '/en/partners/')
    expect(link('Partners')).toHaveAttribute('aria-current', 'page')
    expect(link('About')).not.toHaveAttribute('aria-current')
  })

  it('keeps Home active when the path has a trailing slash only', () => {
    mocks.pathname = '/en'
    renderHeader()
    expect(link('Home')).toHaveAttribute('aria-current', 'page')
  })
})
