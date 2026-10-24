import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import MarkdownRenderer from '@/components/markdown/MarkdownRenderer'

vi.stubGlobal('React', React)

const mermaidMocks = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn(),
}))

vi.mock('mermaid', () => ({ default: mermaidMocks }))

beforeEach(() => {
  mermaidMocks.initialize.mockClear()
  mermaidMocks.render.mockClear()
  mermaidMocks.render.mockResolvedValue({ svg: '<svg data-testid="mermaid-svg"></svg>' })
})

describe('MermaidDiagram security (D59)', () => {
  it('initializes mermaid with securityLevel strict and without htmlLabels override', async () => {
    const { container } = render(
      <MarkdownRenderer content={'```mermaid\ngraph TD;\n  A-->B;\n```'} />
    )

    await waitFor(() => {
      expect(container.querySelector('svg')).not.toBeNull()
    })

    expect(mermaidMocks.initialize).toHaveBeenCalledTimes(1)
    const config = mermaidMocks.initialize.mock.calls[0][0]
    expect(config.securityLevel).toBe('strict')
    expect(config.startOnLoad).toBe(false)
    expect(config.flowchart).toEqual({ useMaxWidth: false, curve: 'basis' })
    expect(config.flowchart).not.toHaveProperty('htmlLabels')
  })

  it('passes the fence source to mermaid.render', async () => {
    const { container } = render(
      <MarkdownRenderer content={'```mermaid\nsequenceDiagram\n  Alice->>Bob: Hi\n```'} />
    )

    await waitFor(() => {
      expect(container.querySelector('svg')).not.toBeNull()
    })

    expect(mermaidMocks.render).toHaveBeenCalledTimes(1)
    const [, code] = mermaidMocks.render.mock.calls[0]
    expect(code).toContain('sequenceDiagram')
    expect(code).toContain('Alice->>Bob: Hi')
  })
})
