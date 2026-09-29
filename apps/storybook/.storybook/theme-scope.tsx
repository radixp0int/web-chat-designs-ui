import { useLayoutEffect, type ReactNode } from 'react'

/**
 * Themes go on `<html>`, never a wrapper div. `body` paints `var(--canvas)`
 * from `:root`, and HoverCard, Tooltip and Modal portal into `document.body` —
 * a class on an inner element would leave both on the previous palette.
 */
export function ThemeScope({
  mode,
  palette,
  highlight,
  children,
}: {
  mode: 'light' | 'dark'
  palette: string
  highlight: string
  children: ReactNode
}) {
  useLayoutEffect(() => {
    const root = document.documentElement
    const stale = [...root.classList].filter(
      (c) => c.startsWith('chat-theme-') || c.startsWith('chat-highlight-'),
    )
    root.classList.remove(...stale, 'light', 'dark')
    root.classList.add(mode, `chat-theme-${palette}`, `chat-highlight-${highlight}`)
  }, [mode, palette, highlight])
  return children
}
