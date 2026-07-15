import { useState } from 'react'
import { ConversationView } from './components/ConversationView'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { useChat } from './hooks/useChat'
import { createCannedResponder } from './lib/chatEngine'
import { cannedTurns } from './responses'

// Swap this for an API-backed Responder to wire in a real model.
const responder = createCannedResponder(cannedTurns)

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { messages, busy, send, reset } = useChat(responder)

  const startNewChat = () => {
    reset()
    setSidebarOpen(false)
  }

  return (
    <div className="relative flex h-dvh gap-4 overflow-hidden p-4">
      <AmbientGlow />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={startNewChat} />

      <main className="glass relative flex min-w-0 flex-1 flex-col rounded-3xl">
        <TopBar onOpenSidebar={() => setSidebarOpen(true)} />
        <ConversationView messages={messages} busy={busy} onSubmit={send} />
      </main>
    </div>
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
