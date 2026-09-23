import { useEffect, useMemo, useState } from 'react'
import { BrandingProvider } from '../lib/branding'
import { createCannedResponder } from '../lib/engine/chatEngine'
import type { Highlight, Source } from '../lib/types'
import { createWsResponder } from '../lib/engine/wsResponder'
import { CitationsProvider } from '../lib/citations'
import { applyFeatureGate } from '../lib/settings'
import { ReferencePanel } from '../lib/components/reference-panel'
import { ResizableColumn } from '../lib/components/resizable-column'
import { useChat } from '../lib/hooks/useChat'
import { useDemoScope } from './useDemoFacets'
import { ConversationView } from './components/ConversationView'
import { FeatureTogglesModal } from './components/FeatureTogglesModal'
import { Sidebar } from './components/Sidebar'
import { UserSettingsModal } from './components/UserSettingsModal'
import { TopBar } from './components/TopBar'
import { aristotleBranding } from './config'
import { DemoFeaturesProvider, useDemoFeatureState } from './demoFeatures'
import { cannedTurns } from './mocks/cannedTurns'
import { todaysSuggestions, typeaheadPool } from './mocks/suggestions'
import { AmbientGlow } from './components/AmbientGlow'

// With VITE_WS_URL set (see .env.development), responses stream from the
// mock WebSocket server in ../chat-ws-server; otherwise fall back to the
// local canned responder.
const wsUrl = import.meta.env.VITE_WS_URL as string | undefined
const responder = wsUrl ? createWsResponder(wsUrl) : createCannedResponder(cannedTurns)

type CitationState = { sources: Source[]; activeId: number; highlights?: Highlight[] } | null

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && window.localStorage.getItem('sidebar-collapsed') === '1',
  )
  const [citation, setCitation] = useState<CitationState>(null)
  // The two dialogs behind the sidebar's account menu. Both are modal, so at
  // most one is ever open — opening either closes the other.
  const [dialog, setDialog] = useState<'user' | 'features' | null>(null)
  // The filters rail, as the transcript sees it: how to record the scope a
  // turn runs under, what is set now, and how to put an old scope back. The
  // widget reads the same hook, so both hosts wire it identically.
  const scope = useDemoScope()
  const {
    messages,
    busy,
    queue,
    held,
    send,
    stop,
    sendNow,
    sendQueuedNow,
    editQueued,
    moveQueued,
    removeQueued,
    hold,
    resume,
    clearQueue,
    chain,
    retry,
    reset,
  } = useChat(responder, { captureScope: scope.capture })
  // Held here rather than read from context: the shell needs the flags in its
  // own render to gate the messages, and provides the same object below.
  const demo = useDemoFeatureState()
  // Memoized on identity: with a flag off the mapper rebuilds the array, and a
  // fresh array every render would make every ChatMessage below re-render
  // (none of them are memoized) even when nothing about them changed.
  const shownMessages = useMemo(
    () => applyFeatureGate(messages, demo.flags),
    [messages, demo.flags],
  )

  useEffect(() => {
    window.localStorage.setItem('sidebar-collapsed', collapsed ? '1' : '0')
  }, [collapsed])

  const startNewChat = () => {
    reset()
    setSidebarOpen(false)
    setCitation(null)
  }

  return (
    <BrandingProvider value={aristotleBranding}>
      <DemoFeaturesProvider value={demo}>
        {/* The highlight swatch rides on the shell rather than on <html>, which
            is how an app would really scope it — and is worth having here,
            because a citation's hover card portals to document.body and has to
            mirror this class back out to keep the same colour. */}
        <div
          className={`chat-highlight-${demo.highlight} relative flex h-dvh gap-4 overflow-hidden p-4`}
        >
          <AmbientGlow />
          <Sidebar
            open={sidebarOpen}
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed((v) => !v)}
            onClose={() => setSidebarOpen(false)}
            onNewChat={startNewChat}
            onOpenUserSettings={() => {
              setDialog('user')
              setSidebarOpen(false)
            }}
            onOpenFeatureToggles={() => {
              setDialog('features')
              setSidebarOpen(false)
            }}
          />

          <CitationsProvider
            value={(sources, id, highlights) => setCitation({ sources, activeId: id, highlights })}
          >
            <main className="glass relative flex min-w-0 flex-1 overflow-hidden rounded-xl">
              <div className="flex min-w-0 flex-1 flex-col">
                <TopBar onOpenSidebar={() => setSidebarOpen(true)} />
                <ConversationView
                  scopeChips={scope.chips}
                  onRestoreScope={scope.onRestore}
                  messages={shownMessages}
                  busy={busy}
                  showActions={demo.flags.actions}
                  queue={queue}
                  held={held}
                  onSubmit={send}
                  onStop={stop}
                  onSendNow={sendNow}
                  onSendQueuedNow={sendQueuedNow}
                  onEditQueued={editQueued}
                  onMoveQueued={moveQueued}
                  onRemoveQueued={removeQueued}
                  onHold={hold}
                  onResume={resume}
                  onClearQueue={clearQueue}
                  onRetry={retry}
                  chain={chain}
                  features={{ suggestions: demo.flags.suggestions, queue: demo.flags.queue }}
                  suggestions={todaysSuggestions}
                  typeaheadPool={typeaheadPool}
                />
              </div>

              {/* Desktop: the reference pane shares the card with the chat,
                split by a border — same design as the widget's split view. */}
              {citation && (
                <ResizableColumn
                  initial={448}
                  storageKey="ref-panel-w"
                  minWidth={320}
                  minRemainder={360}
                  aria-label="Resize reference panel"
                  className="hidden animate-fade-up flex-col border-l border-line lg:flex"
                >
                  <ReferencePanel
                    sources={citation.sources}
                    activeId={citation.activeId}
                    highlights={citation.highlights}
                    onSelect={(id) => setCitation((c) => c && { ...c, activeId: id })}
                    onClose={() => setCitation(null)}
                  />
                </ResizableColumn>
              )}
            </main>
          </CitationsProvider>

          {/* Mobile: the reference pane is a full-height slide-over card. */}
          {citation && (
            <>
              {/* Mobile scrim, mirroring the Sidebar's */}
              <div
                aria-hidden
                onClick={() => setCitation(null)}
                className="fixed inset-0 z-30 bg-scrim/40 backdrop-blur-sm lg:hidden"
              />
              <aside
                className="glass fixed inset-y-0 right-0 z-40 flex w-[min(26rem,100vw)] animate-fade-up flex-col overflow-hidden rounded-l-xl lg:hidden"
                aria-label="References"
              >
                <ReferencePanel
                  sources={citation.sources}
                  activeId={citation.activeId}
                  highlights={citation.highlights}
                  onSelect={(id) => setCitation((c) => c && { ...c, activeId: id })}
                  onClose={() => setCitation(null)}
                />
              </aside>
            </>
          )}

          <UserSettingsModal open={dialog === 'user'} onClose={() => setDialog(null)} />
          <FeatureTogglesModal open={dialog === 'features'} onClose={() => setDialog(null)} />
        </div>
      </DemoFeaturesProvider>
    </BrandingProvider>
  )
}

/** Soft brand-colored wash bleeding in from the page corners. */

export default App
