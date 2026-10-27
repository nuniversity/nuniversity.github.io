'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { safeGet, safeSet } from '@/lib/storage/safe-storage'
import {
  applyTheme,
  parseStoredTheme,
  readAppliedTheme,
  THEME_STORAGE_KEY,
  type Theme,
} from '@/lib/theme/theme'

interface ThemeContextType {
  theme: Theme
  /** False until the browser's real theme has been resolved. */
  ready: boolean
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

function ThemeProvider({ children }: { children: React.ReactNode }) {
  // `light` is only the server-render default. The real value is read from
  // the DOM once mounted — the inline script in <head> has already applied it.
  const [theme, setTheme] = useState<Theme>('light')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // The init script already put the correct class on <html>, so trust the
    // DOM rather than re-deriving and risk a second, contradicting decision.
    const applied = readAppliedTheme()
    const stored = parseStoredTheme(safeGet(THEME_STORAGE_KEY))
    setTheme(stored ?? applied ?? 'light')
    setReady(true)
  }, [])

  useEffect(() => {
    // Writing before the real theme is known would remove the class the init
    // script applied, which is exactly the flash this provider used to cause.
    if (!ready) return
    safeSet(THEME_STORAGE_KEY, theme)
    applyTheme(theme)
  }, [theme, ready])

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, ready, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}
