// FixWrapper.tsx
'use client'

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import type { SyntaxHighlighterProps } from 'react-syntax-highlighter'

export default function SyntaxHighlighterWrapper(props: SyntaxHighlighterProps) {
  return <SyntaxHighlighter {...props} style={vscDarkPlus as any} />
}