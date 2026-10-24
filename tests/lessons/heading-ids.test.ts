import { describe, expect, it } from 'vitest'
import { rehypeHeadingIds } from '@/lib/lessons/heading-ids'

interface HastNode {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

function text(value: string): HastNode {
  return { type: 'text', value }
}

function element(tagName: string, children: HastNode[] = [], properties?: Record<string, unknown>): HastNode {
  return { type: 'element', tagName, properties: properties ?? {}, children }
}

function run(tree: HastNode): HastNode {
  rehypeHeadingIds()(tree)
  return tree
}

function ids(tree: HastNode): (string | undefined)[] {
  const out: (string | undefined)[] = []
  const walk = (node: HastNode) => {
    if (node.type === 'element' && node.properties && node.properties.id !== undefined) {
      out.push(node.properties.id as string)
    }
    node.children?.forEach(walk)
  }
  walk(tree)
  return out
}

describe('rehypeHeadingIds', () => {
  it('adds slug ids to h2 and h3', () => {
    const tree = element('root', [element('h2', [text('Getting Started')]), element('h3', [text('Prerequisites')])])

    run(tree)

    expect(ids(tree)).toEqual(['getting-started', 'prerequisites'])
  })

  it('does not touch other headings', () => {
    const tree = element('root', [element('h1', [text('Title')]), element('h4', [text('Deep')])])

    run(tree)

    expect(ids(tree)).toEqual([])
  })

  it('suffixes duplicate headings with -2, -3', () => {
    const tree = element('root', [
      element('h2', [text('Summary')]),
      element('h3', [text('Summary')]),
      element('h2', [text('Summary')]),
    ])

    run(tree)

    expect(ids(tree)).toEqual(['summary', 'summary-2', 'summary-3'])
  })

  it('resets the dedupe counter per tree', () => {
    const first = run(element('root', [element('h2', [text('Intro')])]))
    const second = run(element('root', [element('h2', [text('Intro')])]))

    expect(ids(first)).toEqual(['intro'])
    expect(ids(second)).toEqual(['intro'])
  })

  it('concatenates nested children and strips accents', () => {
    const tree = element('root', [
      element('h2', [element('strong', [text('Avaliação')]), text(' final')]),
    ])

    run(tree)

    expect(ids(tree)).toEqual(['avaliacao-final'])
  })

  it('falls back to "section" when the heading has no text', () => {
    const tree = element('root', [element('h2', [])])

    run(tree)

    expect(ids(tree)).toEqual(['section'])
  })
})
