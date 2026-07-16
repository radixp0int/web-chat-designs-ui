import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import cssText from '../styles.css?inline'
import {
  ChatWidget,
  type WidgetContent,
  type WidgetController,
  type WidgetPosition,
} from './ChatWidget'
import type { ThemeMode } from './useHostTheme'

export type MountOptions = {
  /** Element the widget host node is appended to. Defaults to document.body. */
  target?: HTMLElement
  /** 'auto' (default) follows the host page's `dark` class / OS preference. */
  theme?: ThemeMode
  position?: WidgetPosition
  zIndex?: number
}

export type WidgetHandle = {
  open(): void
  close(): void
  setTheme(theme: ThemeMode): void
  destroy(): void
}

const FONT_LINKS_ID = 'chat-widget-fonts'
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Libre+Franklin:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap'

// @font-face rules don't register from inside a shadow root, so the widget's
// font stylesheet goes into the host document's head. The family is only ever
// *used* inside the widget's shadow tree.
function injectFonts() {
  if (document.getElementById(FONT_LINKS_ID)) return
  for (const attrs of [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: '' },
    { rel: 'stylesheet', href: FONT_HREF, id: FONT_LINKS_ID },
  ]) {
    const link = document.createElement('link')
    Object.assign(link, attrs)
    document.head.appendChild(link)
  }
}

/**
 * Mount the chat widget into a shadow root so host-page CSS can't restyle it
 * and the widget's (Tailwind) CSS can't leak out. `content` supplies the
 * host-specific pieces (responder, branding, personas, starters, side panels,
 * profile); `options` covers placement and theme. Returns a control handle.
 */
export function mountWidget(content: WidgetContent, options: MountOptions = {}): WidgetHandle {
  const {
    target = document.body,
    theme = 'auto',
    position = 'bottom-right',
    zIndex = 2147483000,
  } = options

  injectFonts()

  const host = document.createElement('div')
  host.setAttribute('data-chat-widget', '')
  const shadow = host.attachShadow({ mode: 'open' })
  const style = document.createElement('style')
  style.textContent = cssText
  shadow.appendChild(style)
  const mountEl = document.createElement('div')
  shadow.appendChild(mountEl)
  target.appendChild(host)

  const controller: WidgetController = { current: null }
  const root = createRoot(mountEl)
  root.render(
    <StrictMode>
      <ChatWidget
        {...content}
        initialTheme={theme}
        position={position}
        zIndex={zIndex}
        controller={controller}
      />
    </StrictMode>,
  )

  return {
    open: () => controller.current?.open(),
    close: () => controller.current?.close(),
    setTheme: (t) => controller.current?.setTheme(t),
    destroy: () => {
      // Defer so we never unmount synchronously inside a host React render/commit
      // (e.g. a route change unmounting the page whose effect cleanup calls this).
      queueMicrotask(() => {
        root.unmount()
        host.remove()
      })
    },
  }
}
