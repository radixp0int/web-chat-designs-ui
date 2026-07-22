import { useEffect, useRef, useState } from 'react'
import { useBranding } from '../branding'
import { ChatMessage } from '../components/chat-message'
import { Composer } from '../components/composer'
import {
  CollapseDiagonalIcon,
  ExpandDiagonalIcon,
  MinusIcon,
  RefreshIcon,
  XIcon,
} from '../components/icons'
import { IconButton } from '../components/icon-button'
import { ReferencePanel } from '../components/reference-panel'
import { ResizableColumn } from '../components/resizable-column'
import { SideTabPanel, SideTabRail, type SideTab } from '../components/side-tabs'
import type { Highlight, Message, Persona, SidePanel, Source } from '../types'

/** Host-provided profile shown in the header and greeting. */
export type WidgetProfile = { name: string; loginId?: string }

type WidgetPanelProps = {
  messages: Message[]
  busy: boolean
  expanded: boolean
  citation: { sources: Source[]; activeId: number; highlights?: Highlight[] } | null
  /** Personas offered by the composer's persona menu. */
  personas: Persona[]
  /** Suggested prompts shown on the empty greeting screen. */
  starters: string[]
  /** Host-provided user profile (name / login). */
  profile: WidgetProfile
  /** Host-injected side-rail tabs and their panels. */
  sidePanels: SidePanel[]
  onSelectCitation: (id: number) => void
  onCloseCitation: () => void
  onSubmit: (text: string) => void
  onStop: () => void
  onSteer: (text: string) => void
  onRemoveQueued: (id: number) => void
  onReset: () => void
  onToggleExpand: () => void
  onMinimize: () => void
  onClose: () => void
}

/** The inside of the widget: header, message list (or greeting), composer,
 *  and — when a citation is open — the reference frame (side-by-side split
 *  in the expanded layout, slide-over on the mobile full-screen sheet).
 *  Brand-agnostic: personas, starters, profile, and side panels are injected. */
export function WidgetPanel({
  messages,
  busy,
  expanded,
  citation,
  personas,
  starters,
  profile,
  sidePanels,
  onSelectCitation,
  onCloseCitation,
  onSubmit,
  onStop,
  onSteer,
  onRemoveQueued,
  onReset,
  onToggleExpand,
  onMinimize,
  onClose,
}: WidgetPanelProps) {
  const { appName, disclaimer } = useBranding()
  const [persona, setPersona] = useState<string>(personas[0]?.id ?? '')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inChat = messages.length > 0

  // Side rail: openTab drives visibility; lastTab keeps the panel's title and
  // content stable while the close animation plays.
  const hasRail = sidePanels.length > 0
  const [openTab, setOpenTab] = useState<string | null>(null)
  const [lastTab, setLastTab] = useState<string>(sidePanels[0]?.id ?? '')
  const selectTab = (id: string | null) => {
    setOpenTab(id)
    if (id) setLastTab(id)
  }
  const shownTab = openTab ?? lastTab
  const shownPanel = sidePanels.find((p) => p.id === shownTab)

  const sideTabs: SideTab[] = sidePanels.map((p) => ({
    id: p.id,
    label: p.label,
    icon: p.icon,
    badge: p.badge,
  }))

  const { name, loginId } = profile
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
            {appName}
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
        {hasRail && <SideTabRail tabs={sideTabs} activeId={openTab} onSelect={selectTab} />}

        <div className="relative flex min-w-0 flex-1 flex-col">
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto scroll-smooth px-4 py-4">
            {inChat ? (
              <div className="flex flex-col gap-5">
                {messages.map((m) => (
                  <ChatMessage key={m.id} message={m} onRemoveQueued={onRemoveQueued} />
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <span className="orb block size-12 rounded-full animate-orb-drift" aria-hidden />
                <p className="mt-3 text-base font-semibold text-(--text-strong)">
                  {firstName ? `Hi, ${firstName}` : `Hi, I'm ${appName}`}
                </p>
                <p className="text-sm text-(--text-soft)">
                  {firstName ? `I'm ${appName} — how can I help?` : `Ask ${appName} anything.`}
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
              streaming={busy}
              onStop={onStop}
              onSubmit={(text, opts) => (opts?.steer ? onSteer(text) : onSubmit(text))}
              personas={personas}
              persona={persona}
              onPersonaChange={setPersona}
            />
            <p className="mt-1.5 text-center text-[10px] text-(--text-soft)/70">{disclaimer}</p>
          </div>

          {/* Side-tab panel — slides over the chat column, next to the rail. */}
          {hasRail && (
            <div
              className={`absolute inset-0 z-10 flex flex-col bg-(--panel-solid) transition-[opacity,translate] duration-300 ease-out ${
                openTab
                  ? 'translate-x-0 opacity-100'
                  : 'pointer-events-none -translate-x-2 opacity-0'
              }`}
              inert={!openTab}
            >
              {shownPanel && (
                <SideTabPanel title={shownPanel.title} onClose={() => selectTab(null)}>
                  {shownPanel.content}
                </SideTabPanel>
              )}
            </div>
          )}
        </div>

        {/* Reference frame — side-by-side split in the wide expanded layout. */}
        {citation && (
          <ResizableColumn
            initial={360}
            aria-label="Resize reference panel"
            className="hidden flex-col border-l border-(--panel-border) sm:flex"
          >
            <ReferencePanel
              sources={citation.sources}
              activeId={citation.activeId}
              highlights={citation.highlights}
              onSelect={onSelectCitation}
              onClose={onCloseCitation}
            />
          </ResizableColumn>
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
              highlights={citation.highlights}
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
