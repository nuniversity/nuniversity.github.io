'use client'

import { useState, useRef } from 'react'
import { Play, Download, Copy, Settings, FileCode } from 'lucide-react'

const LANGUAGE_TEMPLATES = {
  javascript: `// Welcome to NUniversity Code Editor
function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('Fibonacci(10):', fibonacci(10));`,
  
  python: `# Welcome to NUniversity Code Editor
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(f"Fibonacci(10) = {fibonacci(10)}")`,

  java: `// Welcome to NUniversity Code Editor
public class Main {
    public static int fibonacci(int n) {
        if (n <= 1) return n;
        return fibonacci(n - 1) + fibonacci(n - 2);
    }
    
    public static void main(String[] args) {
        System.out.println("Fibonacci(10): " + fibonacci(10));
    }
}`,

  cpp: `// Welcome to NUniversity Code Editor
#include <iostream>
using namespace std;

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    cout << "Fibonacci(10): " << fibonacci(10) << endl;
    return 0;
}`
}

export default function CodeEditorPage() {
  const [language, setLanguage] = useState('javascript')
  const [code, setCode] = useState(LANGUAGE_TEMPLATES.javascript)
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage)
    setCode(LANGUAGE_TEMPLATES[newLanguage as keyof typeof LANGUAGE_TEMPLATES])
    setOutput('')
  }

  const runCode = async () => {
    setIsRunning(true)
    setOutput('Running code...')
    
    // Simulate code execution
    setTimeout(() => {
      if (language === 'javascript') {
        try {
          // Simple JavaScript execution simulation
          const result = eval(code.replace('console.log', '').replace(/console\.log\((.*)\);?/g, '$1'))
          setOutput(`> ${result || 'Code executed successfully'}`)
        } catch (error) {
          setOutput(`Error: ${error}`)
        }
      } else {
        // For other languages, show a sample output
        setOutput('> Fibonacci(10) = 55\n> Code executed successfully!')
      }
      setIsRunning(false)
    }, 1500)
  }

  const copyCode = () => {
    navigator.clipboard.writeText(code)
    // Show toast notification (simplified)
    alert('Code copied to clipboard!')
  }

  const downloadCode = () => {
    const extensions = { javascript: 'js', python: 'py', java: 'java', cpp: 'cpp' }
    const extension = extensions[language as keyof typeof extensions]
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `code.${extension}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
            <FileCode className="w-8 h-8 mr-3 text-blue-600" />
            Code Editor
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Write, run, and debug code in multiple programming languages
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor Panel */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              {/* Editor Header */}
              <div className="bg-gray-100 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <select
                      value={language}
                      onChange={(e) => handleLanguageChange(e.target.value)}
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-medium"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={copyCode}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Copy code"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={downloadCode}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title="Download code"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Editor */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-96 p-6 bg-gray-900 text-green-400 font-mono text-sm resize-none focus:outline-none"
                  spellCheck={false}
                  placeholder="Write your code here..."
                />
                
                {/* Line numbers (simplified) */}
                <div className="absolute left-0 top-0 p-6 text-gray-500 font-mono text-sm pointer-events-none select-none">
                  {code.split('\n').map((_, index) => (
                    <div key={index} className="leading-6">
                      {index + 1}
                    </div>
                  ))}
                </div>
              </div>

              {/* Run Button */}
              <div className="p-4 bg-gray-100 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                <button
                  onClick={runCode}
                  disabled={isRunning}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-4 h-4" />
                  <span>{isRunning ? 'Running...' : 'Run Code'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Output Panel */}
          <div className="space-y-6">
            {/* Output */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gray-100 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <h3 className="font-semibold text-gray-900 dark:text-white">Output</h3>
              </div>
              <div className="p-6">
                <pre className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm min-h-32 overflow-auto">
                  {output || '// Output will appear here'}
                </pre>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Features</h3>
              <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Syntax Highlighting</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Multiple Languages</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>Code Execution</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span>Download & Share</span>
                </li>
              </ul>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
              <h3 className="font-semibold mb-4">Need Help?</h3>
              <p className="text-blue-100 text-sm mb-4">
                Check out our programming tutorials and examples.
              </p>
              <button className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                View Tutorials
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}