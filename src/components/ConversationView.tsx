import { useEffect, useRef, useState } from 'react'
import { DISCLAIMER } from '../config'
import type { Message } from '../lib/chatEngine'
import type { PersonaId } from '../personas'
import { ChatMessage } from './ChatMessage'
import { Composer } from './Composer'
import { Hero, HeroSuggestions } from './Hero'

type ConversationViewProps = {
  messages: Message[]
  busy: boolean
  onSubmit: (text: string) => void
}

/**
 * The center column: the greeting hero before the first message, the message
 * list after, and the composer — centered at first, then docked to the bottom.
 * Owns the persona selection shared by both composer positions.
 */
export function ConversationView({ messages, busy, onSubmit }: ConversationViewProps) {
  const [persona, setPersona] = useState<PersonaId>('concierge')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inChat = messages.length > 0

  // Keep the newest message in view while it streams.
  useEffect(() => {
    if (messages.length === 0) return
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages])

  const composer = (docked: boolean) => (
    <Composer
      docked={docked}
      disabled={busy}
      onSubmit={onSubmit}
      persona={persona}
      onPersonaChange={setPersona}
    />
  )

  return (
    <>
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto scroll-smooth">
        <div
          className={`mx-auto flex w-full max-w-3xl flex-col px-5 transition-all duration-500 ${
            inChat ? 'py-6' : 'min-h-full'
          }`}
        >
          {inChat ? (
            <div className="flex flex-col gap-7">
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
            </div>
          ) : (
            /* my-auto centers when there is room, without clipping on short viewports */
            <div className="my-auto py-8">
              <Hero />
              <div className="mt-9 mb-8">{composer(false)}</div>
              <HeroSuggestions onPrompt={onSubmit} />
            </div>
          )}
        </div>
      </div>

      {inChat && (
        <div className="mx-auto w-full max-w-3xl px-5 pb-5 animate-fade-up">
          {composer(true)}
          <p className="mt-2.5 text-center text-xs text-(--text-soft)/80">{DISCLAIMER}</p>
        </div>
      )}
    </>
  )
}
