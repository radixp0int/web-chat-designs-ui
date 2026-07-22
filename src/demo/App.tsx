import { useEffect, useState } from 'react'
import { BrandingProvider } from '../lib/branding'
import { createCannedResponder } from '../lib/engine/chatEngine'
import type { Highlight, Source } from '../lib/types'
import { createWsResponder } from '../lib/engine/wsResponder'
import { CitationsProvider } from '../lib/citations'
import { ReferencePanel } from '../lib/components/ReferencePanel'
import { ResizableColumn } from '../lib/components/ResizableColumn'
import { useChat } from '../lib/hooks/useChat'
import { ConversationView } from './components/ConversationView'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { aristotleBranding } from './config'
import { cannedTurns } from './mocks/cannedTurns'
import { personas } from './personas'

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
  const { messages, busy, send, stop, steer, removeQueued, reset } = useChat(responder)

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
      <div className="relative flex h-dvh gap-4 overflow-hidden p-4">
        <AmbientGlow />
        <Sidebar
          open={sidebarOpen}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
          onClose={() => setSidebarOpen(false)}
          onNewChat={startNewChat}
        />

        <CitationsProvider
          value={(sources, id, highlights) => setCitation({ sources, activeId: id, highlights })}
        >
          <main className="glass relative flex min-w-0 flex-1 overflow-hidden rounded-3xl">
            <div className="flex min-w-0 flex-1 flex-col">
              <TopBar onOpenSidebar={() => setSidebarOpen(true)} />
              <ConversationView
                messages={messages}
                busy={busy}
                onSubmit={send}
                onStop={stop}
                onSteer={steer}
                onRemoveQueued={removeQueued}
                personas={personas}
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
                className="hidden animate-fade-up flex-col border-l border-(--panel-border) lg:flex"
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
              className="fixed inset-0 z-30 bg-brand-950/40 backdrop-blur-sm lg:hidden"
            />
            <aside
              className="glass fixed inset-y-0 right-0 z-40 flex w-[min(26rem,100vw)] animate-fade-up flex-col overflow-hidden rounded-l-3xl lg:hidden"
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
      </div>
    </BrandingProvider>
  )
}

/** Soft brand-colored wash bleeding in from the page corners. */
function AmbientGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        background: `radial-gradient(60rem 40rem at 80% -10%, var(--canvas-glow-a), transparent 60%),
          radial-gradient(50rem 35rem at -10% 110%, var(--canvas-glow-b), transparent 60%)`,
      }}
    />
  )
}

export default App
