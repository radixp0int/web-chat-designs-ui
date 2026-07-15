import { useEffect, useState } from 'react'
import { ChatIcon, XIcon } from '../components/Icons'
import { UiSizeProvider } from '../components/uiSize'
import { useChat } from '../hooks/useChat'
import { createCannedResponder } from '../lib/chatEngine'
import { cannedTurns } from '../responses'
import { APP_NAME } from '../config'
import { useHostTheme, type ThemeMode } from './useHostTheme'
import { WidgetPanel } from './WidgetPanel'

export type WidgetPosition = 'bottom-right' | 'bottom-left'

/** Imperative surface the embed handle drives (open/close/setTheme). */
export type WidgetController = {
  current: {
    open(): void
    close(): void
    setTheme(theme: ThemeMode): void
  } | null
}

type ChatWidgetProps = {
  initialTheme: ThemeMode
  position: WidgetPosition
  zIndex: number
  controller: WidgetController
}

/**
 * The floating launcher orb plus the pop-in chat panel. Chat state lives
 * here — the panel is hidden with CSS rather than unmounted, so the
 * conversation and draft survive closing and reopening.
 */
export function ChatWidget({ initialTheme, position, zIndex, controller }: ChatWidgetProps) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialTheme)
  const dark = useHostTheme(themeMode)

  // Swap this for an API-backed Responder to wire in a real model.
  const [responder] = useState(() => createCannedResponder(cannedTurns))
  const { messages, busy, send, reset } = useChat(responder)

  useEffect(() => {
    controller.current = {
      open: () => setOpen(true),
      close: () => setOpen(false),
      setTheme: setThemeMode,
    }
    return () => {
      controller.current = null
    }
  }, [controller])

  const right = position === 'bottom-right'

  // Minimize keeps the conversation for later; close ends it.
  const minimize = () => setOpen(false)
  const close = () => {
    setOpen(false)
    setExpanded(false)
    reset()
  }

  return (
    <div
      className={`${dark ? 'dark' : ''} font-sans text-(--text-body) antialiased`}
      style={{ colorScheme: dark ? 'dark' : 'light' }}
    >
      <UiSizeProvider value="compact">
        <div
          role="dialog"
          aria-label={`${APP_NAME} chat`}
          inert={!open}
          style={{ zIndex }}
          className={`fixed bottom-24 flex max-h-[calc(100dvh-7rem)] flex-col overflow-hidden rounded-3xl border border-(--panel-border) bg-(--panel-solid) shadow-2xl shadow-brand-950/25 transition-all duration-300 ease-out max-sm:top-0 max-sm:right-0 max-sm:bottom-0 max-sm:left-0 max-sm:h-auto max-sm:max-h-none max-sm:w-auto max-sm:rounded-none ${
            expanded
              ? 'h-[85dvh] w-[min(560px,calc(100vw-2.5rem))]'
              : 'h-[600px] w-[380px]'
          } ${
            right ? 'right-5 origin-bottom-right' : 'left-5 origin-bottom-left'
          } ${
            open
              ? 'translate-y-0 scale-100 opacity-100'
              : 'pointer-events-none translate-y-2 scale-95 opacity-0'
          }`}
        >
          <WidgetPanel
            messages={messages}
            busy={busy}
            expanded={expanded}
            onSubmit={send}
            onReset={reset}
            onToggleExpand={() => setExpanded((e) => !e)}
            onMinimize={minimize}
            onClose={close}
          />
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? 'Close chat' : `Chat with ${APP_NAME}`}
          title={open ? 'Close chat' : `Chat with ${APP_NAME}`}
          style={{ zIndex }}
          className={`orb fixed bottom-5 flex size-14 items-center justify-center rounded-full text-white transition-transform duration-200 hover:scale-105 active:scale-95 ${
            right ? 'right-5' : 'left-5'
          } ${open ? 'max-sm:hidden' : ''}`}
        >
          <span
            aria-hidden
            className={`absolute transition-all duration-300 ${
              open ? 'scale-50 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'
            }`}
          >
            <ChatIcon width={22} height={22} />
          </span>
          <span
            aria-hidden
            className={`absolute transition-all duration-300 ${
              open ? 'scale-100 rotate-0 opacity-100' : 'scale-50 rotate-90 opacity-0'
            }`}
          >
            <XIcon width={22} height={22} />
          </span>
        </button>
      </UiSizeProvider>
    </div>
  )
}
