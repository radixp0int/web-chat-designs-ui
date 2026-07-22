import { useEffect, useState } from 'react'
import { BrandingProvider, type Branding } from '../branding'
import { CitationsProvider } from '../citations'
import { ChatIcon, XIcon } from '../components/icons'
import type { Responder } from '../engine/chatEngine'
import { useChat } from '../hooks/useChat'
import type { Highlight, Persona, SidePanel, Source } from '../types'
import { UiSizeProvider } from '../uiSize'
import { useHostTheme, type ThemeMode } from './useHostTheme'
import { WidgetPanel, type WidgetProfile } from './WidgetPanel'

export type WidgetPosition = 'bottom-right' | 'bottom-left'

/** Imperative surface the mount handle drives (open/close/setTheme). */
export type WidgetController = {
  current: {
    open(): void
    close(): void
    setTheme(theme: ThemeMode): void
  } | null
}

/** Host-supplied content that makes the (otherwise brand-agnostic) widget concrete. */
export type WidgetContent = {
  responder: Responder
  branding: Branding
  personas: Persona[]
  starters: string[]
  sidePanels: SidePanel[]
  /** Hook read inside the widget tree so host-profile changes stay live. */
  useProfile: () => WidgetProfile
}

type ChatWidgetProps = WidgetContent & {
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
export function ChatWidget({
  responder,
  branding,
  personas,
  starters,
  sidePanels,
  useProfile,
  initialTheme,
  position,
  zIndex,
  controller,
}: ChatWidgetProps) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [citation, setCitation] = useState<{
    sources: Source[]
    activeId: number
    highlights?: Highlight[]
  } | null>(null)
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialTheme)
  const dark = useHostTheme(themeMode)
  const profile = useProfile()

  const { messages, busy, send, stop, steer, removeQueued, reset } = useChat(responder)

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
    setCitation(null)
    reset()
  }
  const newChat = () => {
    setCitation(null)
    reset()
  }

  // Opening a citation needs the wide layout to fit the split view; the
  // mobile full-screen override makes the expand a no-op there.
  const openCitation = (sources: Source[], id: number, highlights?: Highlight[]) => {
    setCitation({ sources, activeId: id, highlights })
    setExpanded(true)
  }
  // Shrinking back to the narrow panel leaves no room for the frame.
  const toggleExpand = () => {
    if (expanded) setCitation(null)
    setExpanded(!expanded)
  }

  return (
    <BrandingProvider value={branding}>
      <div
        className={`${dark ? 'dark' : ''} font-sans text-(--text-body) antialiased`}
        style={{ colorScheme: dark ? 'dark' : 'light' }}
      >
        <UiSizeProvider value="compact">
          <div
            role="dialog"
            aria-label={`${branding.appName} chat`}
            inert={!open}
            style={{ zIndex }}
            className={`fixed bottom-24 flex max-h-[calc(100dvh-7rem)] flex-col overflow-hidden rounded-3xl border border-(--panel-border) bg-(--panel-solid) shadow-2xl shadow-brand-950/25 transition-all duration-300 ease-out max-sm:top-0 max-sm:right-0 max-sm:bottom-0 max-sm:left-0 max-sm:h-auto max-sm:max-h-none max-sm:w-auto max-sm:rounded-none ${
              expanded ? 'h-[85dvh] w-[max(560px,calc(100vw-2.5rem))]' : 'h-[600px] w-[380px]'
            } ${right ? 'right-5 origin-bottom-right' : 'left-5 origin-bottom-left'} ${
              open
                ? 'translate-y-0 scale-100 opacity-100'
                : 'pointer-events-none translate-y-2 scale-95 opacity-0'
            }`}
          >
            <CitationsProvider value={openCitation}>
              <WidgetPanel
                messages={messages}
                busy={busy}
                expanded={expanded}
                citation={citation}
                personas={personas}
                starters={starters}
                profile={profile}
                sidePanels={sidePanels}
                onSelectCitation={(id) => setCitation((c) => c && { ...c, activeId: id })}
                onCloseCitation={() => setCitation(null)}
                onSubmit={send}
                onStop={stop}
                onSteer={steer}
                onRemoveQueued={removeQueued}
                onReset={newChat}
                onToggleExpand={toggleExpand}
                onMinimize={minimize}
                onClose={close}
              />
            </CitationsProvider>
          </div>

          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? 'Close chat' : `Chat with ${branding.appName}`}
            title={open ? 'Close chat' : `Chat with ${branding.appName}`}
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
    </BrandingProvider>
  )
}
