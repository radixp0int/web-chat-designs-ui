import { useEffect, useRef, useState } from 'react'
import { ChatMessage } from '../components/ChatMessage'
import { Composer } from '../components/Composer'
import {
  CollapseDiagonalIcon,
  ExpandDiagonalIcon,
  FunnelIcon,
  HistoryIcon,
  MinusIcon,
  RefreshIcon,
  XIcon,
} from '../components/Icons'
import { IconButton } from '../components/IconButton'
import { ReferencePanel } from '../components/ReferencePanel'
import { SideTabPanel, SideTabRail, type SideTab } from '../components/SideTabs'
import { APP_NAME, DISCLAIMER } from '../config'
import type { Message, Source } from '../lib/chatEngine'
import type { PersonaId } from '../personas'
import { FiltersPanel } from './FiltersPanel'
import { RecentChatsPanel } from './RecentChatsPanel'
import { demoFilters, demoRecentChats } from './sideTabData'
import { useHostProfile } from './useHostProfile'

// Short starters sized for the narrow panel — the full Hero doesn't fit here.
const starters = [
  'Help me build a monthly budget',
  'How big should my emergency fund be?',
  'Explain index funds simply',
]

// Side-rail tabs. To add one: extend this union, add an entry to the tabs
// array below, and render its panel in the side-tab overlay.
type SideTabId = 'filters' | 'recents'

const sideTabLabels: Record<SideTabId, string> = {
  filters: 'Filters',
  recents: 'Recent chats',
}

type WidgetPanelProps = {
  messages: Message[]
  busy: boolean
  expanded: boolean
  citation: { sources: Source[]; activeId: number } | null
  onSelectCitation: (id: number) => void
  onCloseCitation: () => void
  onSubmit: (text: string) => void
  onReset: () => void
  onToggleExpand: () => void
  onMinimize: () => void
  onClose: () => void
}

/** The inside of the widget: header, message list (or greeting), composer,
 *  and — when a citation is open — the reference frame (side-by-side split
 *  in the expanded layout, slide-over on the mobile full-screen sheet). */
export function WidgetPanel({
  messages,
  busy,
  expanded,
  citation,
  onSelectCitation,
  onCloseCitation,
  onSubmit,
  onReset,
  onToggleExpand,
  onMinimize,
  onClose,
}: WidgetPanelProps) {
  const [persona, setPersona] = useState<PersonaId>('concierge')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inChat = messages.length > 0

  // Side rail: openTab drives visibility; lastTab keeps the panel's title and
  // content stable while the close animation plays.
  const [openTab, setOpenTab] = useState<SideTabId | null>(null)
  const [lastTab, setLastTab] = useState<SideTabId>('filters')
  const selectTab = (id: string | null) => {
    setOpenTab(id as SideTabId | null)
    if (id) setLastTab(id as SideTabId)
  }
  const shownTab = openTab ?? lastTab

  // Demo state behind the tabs — UI only for now.
  const [filters, setFilters] = useState(demoFilters)
  const [activeChatId, setActiveChatId] = useState(demoRecentChats[0].id)

  const sideTabs: SideTab[] = [
    {
      id: 'filters',
      label: sideTabLabels.filters,
      icon: <FunnelIcon width={16} height={16} />,
      badge: filters.length,
    },
    {
      id: 'recents',
      label: sideTabLabels.recents,
      icon: <HistoryIcon width={16} height={16} />,
    },
  ]

  // Pulled live from the host page (see useHostProfile) to personalize the widget.
  const { name, loginId } = useHostProfile()
  const firstName = name.split(' ')[0]

  // Keep the newest message in view while it streams.
  useEffect(() => {
    if (messages.length === 0) return
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

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
            <IconButton onClick={onReset} aria-label="New chat" title="New chat">
              <RefreshIcon width={16} height={16} />
            </IconButton>
          )}
          {/* The mobile sheet is already full-screen; expand only matters on desktop. */}
          <IconButton
            onClick={onToggleExpand}
            aria-pressed={expanded}
            className="max-sm:hidden"
            aria-label={expanded ? 'Shrink panel' : 'Expand panel'}
            title={expanded ? 'Shrink' : 'Expand'}
          >
            {expanded ? (
              <CollapseDiagonalIcon width={16} height={16} />
            ) : (
              <ExpandDiagonalIcon width={16} height={16} />
            )}
          </IconButton>
          <IconButton onClick={onMinimize} aria-label="Minimize chat" title="Minimize">
            <MinusIcon width={16} height={16} />
          </IconButton>
          <IconButton
            onClick={onClose}
            aria-label="Close chat and end conversation"
            title="End chat"
          >
            <XIcon width={16} height={16} />
          </IconButton>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1">
        <SideTabRail tabs={sideTabs} activeId={openTab} onSelect={selectTab} />

        <div className="relative flex min-w-0 flex-1 flex-col">
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
                {loginId && <p className="text-xs text-(--text-soft)/70">Signed in as {loginId}</p>}
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

          {/* Side-tab panel — slides over the chat column, next to the rail. */}
          <div
            className={`absolute inset-0 z-10 flex flex-col bg-(--panel-solid) transition-[opacity,translate] duration-300 ease-out ${
              openTab ? 'translate-x-0 opacity-100' : 'pointer-events-none -translate-x-2 opacity-0'
            }`}
            inert={!openTab}
          >
            <SideTabPanel title={sideTabLabels[shownTab]} onClose={() => selectTab(null)}>
              {shownTab === 'filters' ? (
                <FiltersPanel
                  filters={filters}
                  onRemove={(id) => setFilters(filters.filter((f) => f.id !== id))}
                  onClear={() => setFilters([])}
                />
              ) : (
                <RecentChatsPanel
                  chats={demoRecentChats}
                  activeId={activeChatId}
                  onSelect={setActiveChatId}
                />
              )}
            </SideTabPanel>
          </div>
        </div>

        {/* Reference frame — side-by-side split in the wide expanded layout. */}
        {citation && (
          <div className="hidden min-w-0 flex-1 flex-col border-l border-(--panel-border) sm:flex">
            <ReferencePanel
              sources={citation.sources}
              activeId={citation.activeId}
              onSelect={onSelectCitation}
              onClose={onCloseCitation}
            />
          </div>
        )}

        {/* Mobile: the panel is full-screen, so the frame slides over the chat. */}
        <div
          className={`absolute inset-0 z-10 flex flex-col bg-(--panel-solid) transition-transform duration-300 ease-out sm:hidden ${
            citation ? 'translate-x-0' : 'pointer-events-none translate-x-full'
          }`}
          inert={!citation}
        >
          {citation && (
            <ReferencePanel
              sources={citation.sources}
              activeId={citation.activeId}
              onSelect={onSelectCitation}
              onClose={onCloseCitation}
              backLabel="Back to chat"
            />
          )}
        </div>
      </div>
    </>
  )
}
