import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import cssText from '../index.css?inline'
import { ChatWidget, type WidgetController, type WidgetPosition } from './ChatWidget'
import type { ThemeMode } from './useHostTheme'

export type AristotleChatOptions = {
  /** Element the widget host node is appended to. Defaults to document.body. */
  target?: HTMLElement
  /** 'auto' (default) follows the host page's `dark` class / OS preference. */
  theme?: ThemeMode
  position?: WidgetPosition
  zIndex?: number
}

export type AristotleChatHandle = {
  open(): void
  close(): void
  setTheme(theme: ThemeMode): void
  destroy(): void
}

const FONT_LINKS_ID = 'aristotle-widget-fonts'
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Libre+Franklin:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap'

// @font-face rules don't register from inside a shadow root, so the font
// stylesheet goes into the host document's head. The family is only ever
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

/** Mount the chat widget. Returns a handle to control or remove it. */
export function init(options: AristotleChatOptions = {}): AristotleChatHandle {
  const {
    target = document.body,
    theme = 'auto',
    position = 'bottom-right',
    zIndex = 2147483000,
  } = options

  injectFonts()

  // All widget DOM lives in a shadow root: host-page CSS can't restyle the
  // widget, and the widget's (Tailwind) CSS can't leak out.
  const host = document.createElement('div')
  host.setAttribute('data-aristotle-chat', '')
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

// Auto-init when loaded via a classic script tag carrying data-auto-init:
//   <script src=".../aristotle-widget.js" data-auto-init data-theme="auto"></script>
// (document.currentScript is null in module scripts, so this requires a
// classic tag; module consumers call init() themselves.)
const script = document.currentScript as HTMLScriptElement | null
if (script && script.dataset.autoInit !== undefined) {
  const boot = () =>
    init({
      theme: script.dataset.theme as ThemeMode | undefined,
      position: script.dataset.position as WidgetPosition | undefined,
    })
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true })
  } else {
    boot()
  }
}
