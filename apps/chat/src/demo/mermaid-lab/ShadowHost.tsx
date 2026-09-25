import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import cssText from '@chat/tokens/tokens.css?inline'

/**
 * Renders children inside a real shadow root, set up the same way
 * `src/lib/widget/mount.tsx` does: styles.css injected as a <style>, and a
 * `chat-theme-*` class on the inner root.
 *
 * This is the widget-compatibility verdict. Anything a renderer puts into
 * `document.head` — mermaid injects a stylesheet there — cannot cross this
 * boundary, so a diagram that looks right above and wrong here is a diagram
 * that will look wrong in the embedded widget.
 */
export function ShadowHost({
  children,
  themeClass = 'chat-theme-aristotle2',
}: {
  children: ReactNode
  themeClass?: string
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [mountEl, setMountEl] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host || host.shadowRoot) return

    const shadow = host.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = cssText
    shadow.appendChild(style)

    const root = document.createElement('div')
    root.className = themeClass
    // brand.css keys dark mode off a `dark` class; inside a shadow tree the
    // host page's <html class="dark"> is invisible, so it is mirrored here.
    const sync = () => {
      const isDark = document.documentElement.classList.contains('dark')
      root.classList.toggle('dark', isDark)
      root.classList.toggle('light', !isDark)
    }
    sync()
    shadow.appendChild(root)
    setMountEl(root)

    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [themeClass])

  return (
    <div ref={hostRef} className="w-full">
      {mountEl && createPortal(children, mountEl)}
    </div>
  )
}
