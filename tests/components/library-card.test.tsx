import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LibraryCard } from '@/components/library/library-card'
import type { LibraryResource } from '@/lib/library/types'

const dict = {
  library: {
    labels: { author: 'By', free: 'Free', paid: 'Paid', pages: 'pages' },
    resource_types: { video: 'Videos', ebook: 'E-Books', analysis: 'Analyses' },
    view_resource: 'View Resource',
    read_analysis: 'Read analysis',
    unknown_author: 'Unknown author',
    unknown_platform: 'Unknown platform',
    unknown_category: 'Uncategorized',
    untitled_resource: 'Untitled resource',
    no_description: 'No description yet.',
  },
}

function resource(overrides: Partial<LibraryResource> = {}): LibraryResource {
  return {
    id: 'r1',
    title: 'A useful resource',
    description: 'A short description',
    type: 'video',
    category: 'Computer Science',
    author: 'Ada Lovelace',
    url: 'https://example.com/watch',
    tags: ['algorithms'],
    language: 'en',
    isPaid: false,
    platform: 'YouTube',
    ...overrides,
  }
}

describe('LibraryCard', () => {
  it('renders an external resource with a safe external link', () => {
    render(<LibraryCard resource={resource()} dict={dict} />)

    expect(screen.getByRole('heading', { name: 'A useful resource' })).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /View Resource/ })
    expect(link).toHaveAttribute('href', 'https://example.com/watch')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('uses an analysis link for the analysis type', () => {
    render(
      <LibraryCard
        resource={resource({
          type: 'analysis',
          url: '/en/library/analysis/a-useful-resource/',
          platform: 'Nuniversity',
        })}
        dict={dict}
      />
    )

    expect(screen.getByRole('link', { name: /Read analysis/ })).toHaveAttribute(
      'href',
      '/en/library/analysis/a-useful-resource/'
    )
    expect(screen.queryByRole('link', { name: /View Resource/ })).not.toBeInTheDocument()
  })

  it('links internal Nuniversity courses inside the app', () => {
    render(
      <LibraryCard
        resource={resource({
          id: 'agent-memory-knowledge',
          title: 'Agent Knowledge Bases and Memory',
          type: 'course',
          url: '/en/courses/agent-memory-knowledge/',
          platform: 'Nuniversity',
        })}
        dict={dict}
      />
    )

    const link = screen.getByRole('link', { name: /Open course/ })
    expect(link).toHaveAttribute('href', '/en/courses/agent-memory-knowledge/')
    expect(link).not.toHaveAttribute('target')
    expect(screen.queryByRole('link', { name: /View Resource/ })).not.toBeInTheDocument()
  })

  it('renders a typed placeholder when there is no thumbnail', () => {
    render(<LibraryCard resource={resource({ thumbnail: undefined })} dict={dict} />)

    expect(screen.getAllByText('YouTube').length).toBeGreaterThan(0)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('falls back when the thumbnail fails to load', () => {
    const { container } = render(
      <LibraryCard resource={resource({ thumbnail: 'https://example.com/broken.jpg' })} dict={dict} />
    )
    const image = container.querySelector('img')
    expect(image).not.toBeNull()
    fireEvent.error(image!)

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getAllByText('Videos').length).toBeGreaterThan(0)
  })

  it('uses placeholders for missing metadata', () => {
    render(
      <LibraryCard
        resource={resource({ author: 'Unknown', category: 'Uncategorized', platform: undefined })}
        dict={dict}
      />
    )

    expect(screen.getByText(/Unknown author/)).toBeInTheDocument()
    expect(screen.getByText('Uncategorized')).toBeInTheDocument()
    expect(screen.getAllByText('Unknown platform').length).toBeGreaterThan(0)
  })
})
