import { useState } from 'react'
import { BrandingProvider } from '../lib/branding'
import { createCannedResponder, type Source } from '../lib/engine/chatEngine'
import { createWsResponder } from '../lib/engine/wsResponder'
import { CitationsProvider } from '../lib/citations'
import { ReferencePanel } from '../lib/components/ReferencePanel'
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

type CitationState = { sources: Source[]; activeId: number } | null

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [citation, setCitation] = useState<CitationState>(null)
  const { messages, busy, send, reset } = useChat(responder)

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
          onClose={() => setSidebarOpen(false)}
          onNewChat={startNewChat}
        />

        <CitationsProvider value={(sources, id) => setCitation({ sources, activeId: id })}>
          <main className="glass relative flex min-w-0 flex-1 flex-col rounded-3xl">
            <TopBar onOpenSidebar={() => setSidebarOpen(true)} />
            <ConversationView messages={messages} busy={busy} onSubmit={send} personas={personas} />
          </main>
        </CitationsProvider>

        {citation && (
          <>
            {/* Mobile scrim, mirroring the Sidebar's */}
            <div
              aria-hidden
              onClick={() => setCitation(null)}
              className="fixed inset-0 z-30 bg-brand-950/40 backdrop-blur-sm lg:hidden"
            />
            <aside
              className="glass relative z-40 flex w-[26rem] shrink-0 animate-fade-up flex-col overflow-hidden rounded-3xl xl:w-[30rem] max-lg:fixed max-lg:inset-y-0 max-lg:right-0 max-lg:w-[min(26rem,100vw)] max-lg:rounded-r-none max-lg:rounded-l-3xl"
              aria-label="References"
            >
              <ReferencePanel
                sources={citation.sources}
                activeId={citation.activeId}
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
