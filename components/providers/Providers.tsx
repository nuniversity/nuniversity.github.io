// 'use client'

// import { ThemeProvider } from 'next-themes'
// import { ReactNode } from 'react'

// export function Providers({ children }: { children: ReactNode }) {
//   return (
//     <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
//       {children}
//     </ThemeProvider>
//   )
// }

'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { safeGet, safeSet } from '@/lib/storage/safe-storage'

type Theme = 'light' | 'dark'

const THEME_KEY = 'theme'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

/** Reads the persisted theme, validating the value rather than trusting it. */
function readStoredTheme(): Theme | null {
  const raw = safeGet(THEME_KEY)
  return raw === 'dark' || raw === 'light' ? raw : null
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const savedTheme = readStoredTheme()
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (savedTheme) {
      setTheme(savedTheme)
    } else if (prefersDark) {
      setTheme('dark')
    }
  }, [])

  useEffect(() => {
    safeSet(THEME_KEY, theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  )
}