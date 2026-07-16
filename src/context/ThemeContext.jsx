import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({ theme: 'light', toggle: () => {} })

const read = () => {
  if (typeof window === 'undefined') return 'light'
  const saved = localStorage.getItem('mb-theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  // O tema real já foi aplicado pelo script no index.html; aqui só o espelhamos.
  const [theme, setTheme] = useState(read)

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.style.colorScheme = theme
    localStorage.setItem('mb-theme', theme)
  }, [theme])

  // Segue o sistema enquanto o usuário não escolher um tema manualmente.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (e) => {
      if (!localStorage.getItem('mb-theme')) setTheme(e.matches ? 'dark' : 'light')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
