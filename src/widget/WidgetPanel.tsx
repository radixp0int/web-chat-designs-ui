import { useEffect, useRef, useState } from 'react'
import { ChatMessage } from '../components/ChatMessage'
import { Composer } from '../components/Composer'
import {
  CollapseDiagonalIcon,
  ExpandDiagonalIcon,
  MinusIcon,
  RefreshIcon,
  XIcon,
} from '../components/Icons'
import { APP_NAME, DISCLAIMER } from '../config'
import type { Message } from '../lib/chatEngine'
import type { PersonaId } from '../personas'
import { useHostProfile } from './useHostProfile'

// Short starters sized for the narrow panel — the full Hero doesn't fit here.
const starters = [
  'Help me build a monthly budget',
  'How big should my emergency fund be?',
  'Explain index funds simply',
]

type WidgetPanelProps = {
  messages: Message[]
  busy: boolean
  expanded: boolean
  onSubmit: (text: string) => void
  onReset: () => void
  onToggleExpand: () => void
  onMinimize: () => void
  onClose: () => void
}

/** The inside of the widget: header, message list (or greeting), composer. */
export function WidgetPanel({
  messages,
  busy,
  expanded,
  onSubmit,
  onReset,
  onToggleExpand,
  onMinimize,
  onClose,
}: WidgetPanelProps) {
  const [persona, setPersona] = useState<PersonaId>('concierge')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inChat = messages.length > 0

  // Pulled live from the host page (see useHostProfile) to personalize the widget.
  const { name, loginId } = useHostProfile()
  const firstName = name.split(' ')[0]

  // Keep the newest message in view while it streams.
  useEffect(() => {
    if (messages.length === 0) return
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  const headerButtonClass =
    'rounded-full p-1.5 text-(--text-soft) transition hover:bg-brand-600/8 hover:text-(--text-strong) dark:hover:bg-white/8'

  return (
    <>
      <header className="flex items-center gap-2.5 border-b border-(--panel-border) px-4 py-3">
        <span className="orb block size-6 shrink-0 rounded-full" aria-hidden />
        <div className="flex min-w-0 flex-col">
          <span className="text-sm leading-tight font-semibold text-(--text-strong)">
            {APP_NAME}
          </span>
          {name && (
            <span className="truncate text-[11px] leading-tight text-(--text-soft)">
              {name}
              {loginId ? ` · ${loginId}` : ''}
            </span>
          )}
        </div>
        <div className="ml-auto flex items-center gap-0.5">
          {inChat && (
            <button
              type="button"
              onClick={onReset}
              className={headerButtonClass}
              aria-label="New chat"
              title="New chat"
            >
              <RefreshIcon width={16} height={16} />
            </button>
          )}
          {/* The mobile sheet is already full-screen; expand only matters on desktop. */}
          <button
            type="button"
            onClick={onToggleExpand}
            aria-pressed={expanded}
            className={`${headerButtonClass} max-sm:hidden`}
            aria-label={expanded ? 'Shrink panel' : 'Expand panel'}
            title={expanded ? 'Shrink' : 'Expand'}
          >
            {expanded ? (
              <CollapseDiagonalIcon width={16} height={16} />
            ) : (
              <ExpandDiagonalIcon width={16} height={16} />
            )}
          </button>
          <button
            type="button"
            onClick={onMinimize}
            className={headerButtonClass}
            aria-label="Minimize chat"
            title="Minimize"
          >
            <MinusIcon width={16} height={16} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className={headerButtonClass}
            aria-label="Close chat and end conversation"
            title="End chat"
          >
            <XIcon width={16} height={16} />
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto scroll-smooth px-4 py-4">
        {inChat ? (
          <div className="flex flex-col gap-5">
            {messages.map((m) => (
              <ChatMessage key={m.id} message={m} />
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <span className="orb block size-12 rounded-full animate-orb-drift" aria-hidden />
            <p className="mt-3 text-base font-semibold text-(--text-strong)">
              {firstName ? `Hi, ${firstName}` : `Hi, I'm ${APP_NAME}`}
            </p>
            <p className="text-sm text-(--text-soft)">
              {firstName
                ? `I'm ${APP_NAME} — ask me anything about your finances.`
                : 'Ask me anything about your finances.'}
            </p>
            {loginId && (
              <p className="text-xs text-(--text-soft)/70">Signed in as {loginId}</p>
            )}
            <div className="mt-4 flex flex-col items-stretch gap-2 self-stretch px-2">
              {starters.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => onSubmit(prompt)}
                  className="glass rounded-full px-4 py-2 text-xs font-semibold text-(--text-body) transition hover:border-accent-500/50 hover:text-(--text-strong)"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-3 pb-2">
        <Composer
          docked
          disabled={busy}
          onSubmit={onSubmit}
          persona={persona}
          onPersonaChange={setPersona}
        />
        <p className="mt-1.5 text-center text-[10px] text-(--text-soft)/70">{DISCLAIMER}</p>
      </div>
    </>
  )
}
