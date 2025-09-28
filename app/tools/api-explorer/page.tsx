'use client'

import { useState, useEffect } from 'react'
import { Send, Database, Download, Copy, RefreshCw } from 'lucide-react'

const SAMPLE_APIS = [
  {
    name: 'JSONPlaceholder - Posts',
    url: 'https://jsonplaceholder.typicode.com/posts',
    description: 'Sample blog posts data'
  },
  {
    name: 'JSONPlaceholder - Users',
    url: 'https://jsonplaceholder.typicode.com/users',
    description: 'Sample user data'
  },
  {
    name: 'OpenWeatherMap (Demo)',
    url: 'https://api.openweathermap.org/data/2.5/weather?q=London&appid=demo',
    description: 'Weather data (requires API key)'
  },
  {
    name: 'Cat Facts API',
    url: 'https://catfact.ninja/fact',
    description: 'Random cat facts'
  },
  {
    name: 'Random Quote API',
    url: 'https://api.quotable.io/random',
    description: 'Inspirational quotes'
  }
]

interface ApiResponse {
  data: any
  status: number
  headers: Record<string, string>
  duration: number
}

export default function ApiExplorerPage() {
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts')
  const [method, setMethod] = useState('GET')
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}')
  const [body, setBody] = useState('')
  const [response, setResponse] = useState<ApiResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const makeRequest = async () => {
    if (!url.trim()) {
      setError('Please enter a URL')
      return
    }

    setIsLoading(true)
    setError('')
    const startTime = Date.now()

    try {
      let requestHeaders: Record<string, string> = {}
      try {
        requestHeaders = headers ? JSON.parse(headers) : {}
      } catch {
        setError('Invalid JSON in headers')
        setIsLoading(false)
        return
      }

      const requestOptions: RequestInit = {
        method,
        headers: requestHeaders,
      }

      if (method !== 'GET' && method !== 'HEAD' && body) {
        requestOptions.body = body
      }

      const response = await fetch(url, requestOptions)
      const duration = Date.now() - startTime
      const responseHeaders: Record<string, string> = {}
      
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      let responseData
      const contentType = response.headers.get('content-type')
      
      if (contentType?.includes('application/json')) {
        responseData = await response.json()
      } else {
        responseData = await response.text()
      }

      setResponse({
        data: responseData,
        status: response.status,
        headers: responseHeaders,
        duration
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
    } finally {
      setIsLoading(false)
    }
  }

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response.data, null, 2))
      alert('Response copied to clipboard!')
    }
  }

  const downloadResponse = () => {
    if (response) {
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'api-response.json'
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const loadSampleApi = (apiUrl: string) => {
    setUrl(apiUrl)
    setMethod('GET')
    setError('')
    setResponse(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
            <Database className="w-8 h-8 mr-3 text-blue-600" />
            API Explorer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test and explore public APIs with real-time responses and detailed information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Request Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* URL and Method */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Request</h3>
              
              <div className="flex space-x-3 mb-4">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-medium min-w-24"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                  <option value="PATCH">PATCH</option>
                </select>
                
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter API URL..."
                  className="flex-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                <button
                  onClick={makeRequest}
                  disabled={isLoading}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{isLoading ? 'Loading...' : 'Send'}</span>
                </button>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Headers */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Headers
                </label>
                <textarea
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  rows={4}
                  className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter headers as JSON..."
                />
              </div>

              {/* Body (for POST/PUT requests) */}
              {method !== 'GET' && method !== 'HEAD' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Request Body
                  </label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={6}
                    className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter request body..."
                  />
                </div>
              )}
            </div>

            {/* Response */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gray-100 dark:bg-gray-700 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 dark:text-white">Response</h3>
                  {response && (
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        response.status >= 200 && response.status < 300
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {response.status}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {response.duration}ms
                      </span>
                      <button
                        onClick={copyResponse}
                        className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Copy response"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={downloadResponse}
                        className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                        title="Download response"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                {response ? (
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
                    {JSON.stringify(response.data, null, 2)}
                  </pre>
                ) : (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Response will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Sample APIs */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Sample APIs</h3>
              <div className="space-y-3">
                {SAMPLE_APIS.map((api, index) => (
                  <button
                    key={index}
                    onClick={() => loadSampleApi(api.url)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="font-medium text-sm text-gray-900 dark:text-white mb-1">
                      {api.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {api.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Response Headers */}
            {response && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Response Headers</h3>
                <div className="space-y-2 max-h-64 overflow-auto">
                  {Object.entries(response.headers).map(([key, value]) => (
                    <div key={key} className="text-sm">
                      <span className="font-medium text-blue-600 dark:text-blue-400">{key}:</span>
                      <span className="text-gray-600 dark:text-gray-400 ml-2 break-all">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
              <h3 className="font-semibold mb-4">💡 Tips</h3>
              <ul className="space-y-2 text-sm text-blue-100">
                <li>• Use JSONPlaceholder for testing</li>
                <li>• Check CORS policies for external APIs</li>
                <li>• Add authentication headers when required</li>
                <li>• Format JSON in request body</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}