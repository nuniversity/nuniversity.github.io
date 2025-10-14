'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import { Info, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react'


interface MarkdownRendererProps {
  content: string
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        // Headings
        h1: ({ children }) => (
          <h1 className="text-4xl font-bold mb-6 mt-8 text-foreground">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-3xl font-bold mb-4 mt-6 text-foreground border-b pb-2">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-2xl font-semibold mb-3 mt-5 text-foreground">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-xl font-semibold mb-2 mt-4 text-foreground">
            {children}
          </h4>
        ),

        // Paragraphs
        p: ({ children }) => (
          <p className="mb-4 leading-7 text-foreground/90">
            {children}
          </p>
        ),

        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside mb-4 space-y-2 ml-4">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside mb-4 space-y-2 ml-4">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="leading-7 text-foreground/90">
            {children}
          </li>
        ),

        // Code blocks
        code: ({ node, inline, className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '')
          const language = match ? match[1] : ''
          
          if (!inline && language) {
            return (
              <div className="my-6 rounded-lg overflow-hidden border border-gray-700">
                <div className="bg-gray-800 px-4 py-2 text-sm text-gray-300 font-mono">
                  {language}
                </div>
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={language}
                  PreTag="div"
                  className="!my-0 !rounded-none"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            )
          }
          
          return (
            <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
              {children}
            </code>
          )
        },

        // Blockquotes - Enhanced with DaisyUI alert styles
        blockquote: ({ children }) => {
          const content = String(children)
          
          // Check for alert types
          if (content.includes('[!NOTE]') || content.includes('[!INFO]')) {
            return (
              <div className="alert alert-info my-4 flex items-start gap-3">
                <Info className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                  {children}
                </div>
              </div>
            )
          }
          
          if (content.includes('[!WARNING]')) {
            return (
              <div className="alert alert-warning my-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                  {children}
                </div>
              </div>
            )
          }
          
          if (content.includes('[!DANGER]') || content.includes('[!ERROR]')) {
            return (
              <div className="alert alert-error my-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                  {children}
                </div>
              </div>
            )
          }
          
          if (content.includes('[!SUCCESS]')) {
            return (
              <div className="alert alert-success my-4 flex items-start gap-3">
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1">
                  {children}
                </div>
              </div>
            )
          }
          
          return (
            <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">
              {children}
            </blockquote>
          )
        },

        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            className="text-primary hover:underline font-medium"
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            {children}
          </a>
        ),

        // Tables - Using DaisyUI table styles
        table: ({ children }) => (
          <div className="overflow-x-auto my-6">
            <table className="table table-zebra w-full">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-base-200">
            {children}
          </thead>
        ),
        th: ({ children }) => (
          <th className="font-semibold text-left">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td>{children}</td>
        ),

        // Horizontal Rule
        hr: () => (
          <hr className="my-8 border-border" />
        ),

        // Images
        img: ({ src, alt }) => (
          <div className="my-6">
            <img
              src={src}
              alt={alt || ''}
              className="rounded-lg max-w-full h-auto shadow-lg"
            />
            {alt && (
              <p className="text-center text-sm text-muted-foreground mt-2">
                {alt}
              </p>
            )}
          </div>
        ),

        // Strong/Bold
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">
            {children}
          </strong>
        ),

        // Emphasis/Italic
        em: ({ children }) => (
          <em className="italic">
            {children}
          </em>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}