import { slugifyHeading } from './slugify'

interface HastNode {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

function textOf(node: HastNode): string {
  if (node.type === 'text') return node.value ?? ''
  if (Array.isArray(node.children)) return node.children.map(textOf).join('')
  return ''
}

export function rehypeHeadingIds() {
  return (tree: HastNode) => {
    const seen = new Map<string, number>()
    const walk = (node: HastNode) => {
      if (node.type === 'element' && (node.tagName === 'h2' || node.tagName === 'h3')) {
        const base = slugifyHeading(textOf(node)) || 'section'
        const count = (seen.get(base) ?? 0) + 1
        seen.set(base, count)
        node.properties = { ...node.properties, id: count === 1 ? base : `${base}-${count}` }
      }
      if (Array.isArray(node.children)) node.children.forEach(walk)
    }
    walk(tree)
  }
}
