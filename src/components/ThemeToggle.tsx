import { useEffect, useState } from 'react'
import { MoonIcon, SunIcon } from './Icons'

export function ThemeToggle() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  useEffect(() => {
    // Keep an explicit light/dark class pair on <html>: the embedded widget's
    // 'auto' theme reads them, and a bare element would fall back to the OS
    // preference instead of this toggle.
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.classList.toggle('light', !dark)
    localStorage.setItem('aristotle-theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <button
      type="button"
      onClick={() => setDark((d) => !d)}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={dark ? 'Light mode' : 'Dark mode'}
      className="glass flex size-9 items-center justify-center rounded-full text-(--text-soft) transition hover:text-accent-500"
    >
      {dark ? <SunIcon width={16} height={16} /> : <MoonIcon width={16} height={16} />}
    </button>
  )
}
