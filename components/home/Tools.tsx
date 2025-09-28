'use client'

import Link from 'next/link'
import { Code, Calculator, Database, Cpu, ArrowRight } from 'lucide-react'

const tools = [
  {
    icon: Code,
    title: 'Code Editor',
    description: 'Full-featured code editor with syntax highlighting and real-time execution.',
    color: 'bg-blue-500',
    href: '/tools/editor',
  },
  {
    icon: Calculator,
    title: 'Scientific Calculator',
    description: 'Advanced calculator with scientific functions and graphing capabilities.',
    color: 'bg-green-500',
    href: '/tools/calculator',
  },
  {
    icon: Database,
    title: 'API Explorer',
    description: 'Interactive tool to explore and test public APIs with real-time data.',
    color: 'bg-purple-500',
    href: '/tools/api-explorer',
  },
  {
    icon: Cpu,
    title: 'Algorithm Visualizer',
    description: 'Visualize sorting algorithms and data structures in action.',
    color: 'bg-orange-500',
    href: '/tools/algorithms',
  },
]

export default function Tools() {
  return (
    <section className="py-20 bg-white dark:bg-gray-800">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Powerful Learning{' '}
            <span className="text-gradient">Tools</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Access professional-grade tools right in your browser. No downloads, no setup required.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {tools.map((tool, index) => (
            <Link
              key={tool.title}
              href={tool.href}
              className="group block bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 card-hover"
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl ${tool.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <tool.icon className="w-6 h-6 text-white" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                {tool.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {tool.description}
              </p>

              {/* Arrow */}
              <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium group-hover:translate-x-1 transition-transform duration-300">
                <span>Try it now</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          ))}
        </div>

        {/* Demo Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                Try Our Code Editor
              </h3>
              <p className="text-blue-100 mb-6">
                Write, run, and debug code in multiple programming languages with our 
                advanced online editor featuring IntelliSense, syntax highlighting, and more.
              </p>
              <Link
                href="/tools/editor"
                className="inline-flex items-center space-x-2 bg-white text-blue-600 font-medium py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Code className="w-5 h-5" />
                <span>Open Editor</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            
            <div className="bg-black/20 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-300 ml-2">main.py</span>
              </div>
              <pre className="text-sm text-green-400 font-mono">
{`# Welcome to NUniversity Code Editor
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(f"Fibonacci(10) = {fibonacci(10)}")
# Output: Fibonacci(10) = 55`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}