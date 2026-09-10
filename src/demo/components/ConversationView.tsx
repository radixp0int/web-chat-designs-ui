import { useState } from 'react'
import { DISCLAIMER } from '../config'
import type { Message } from '../../lib/types'
import type { Persona } from '../../lib/types'
import { ChatMessage } from '../../lib/components/chat-message'
import { Composer } from '../../lib/components/composer'
import { ScrollToBottomButton } from '../../lib/components/scroll-to-bottom-button'
import { useStickToBottom } from '../../lib/hooks/useStickToBottom'
import { Hero, HeroSuggestions } from './Hero'

type ConversationViewProps = {
  messages: Message[]
  busy: boolean
  onSubmit: (text: string) => void
  onStop: () => void
  onSteer: (text: string) => void
  onRemoveQueued: (id: number) => void
  onRetry: (id: number) => void
  personas: Persona[]
  /** Demo toggle: the copy / regenerate / vote row under a finished answer. */
  showActions?: boolean
}

/**
 * The center column: the greeting hero before the first message, the message
 * list after, and the composer — centered at first, then docked to the bottom.
 * Owns the persona selection shared by both composer positions.
 */
export function ConversationView({
  messages,
  busy,
  onSubmit,
  onStop,
  onSteer,
  onRemoveQueued,
  onRetry,
  personas,
  showActions = true,
}: ConversationViewProps) {
  const [persona, setPersona] = useState<string>(personas[0].id)
  const { containerRef, contentRef, atBottom, scrollToBottom } = useStickToBottom()
  const inChat = messages.length > 0
  // Only the newest turn offers follow-ups, so branches don't stack up the thread.
  const lastId = messages[messages.length - 1]?.id

  // A message the reader sends themselves always comes into view, even if
  // they'd scrolled up to reread earlier turns — streamed replies then keep
  // following automatically because this also re-arms `atBottom`.
  const submit = (text: string) => {
    onSubmit(text)
    scrollToBottom()
  }

  const composer = (docked: boolean) => (
    <Composer
      docked={docked}
      streaming={busy}
      onStop={onStop}
      onSubmit={(text, opts) => {
        if (opts?.steer) {
          onSteer(text)
          scrollToBottom()
        } else {
          submit(text)
        }
      }}
      personas={personas}
      persona={persona}
      onPersonaChange={setPersona}
    />
  )

  return (
    <>
      <div className="relative min-h-0 flex-1">
        <div ref={containerRef} className="h-full overflow-y-auto scroll-smooth">
          <div
            ref={contentRef}
            className={`mx-auto flex w-full max-w-3xl flex-col px-5 transition-all duration-500 ${
              inChat ? 'py-6' : 'min-h-full'
            }`}
          >
            {inChat ? (
              <div className="flex flex-col gap-7">
                {messages.map((m) => (
                  <ChatMessage
                    key={m.id}
                    message={m}
                    onRemoveQueued={onRemoveQueued}
                    onRetry={onRetry}
                    onFollowup={m.id === lastId ? submit : undefined}
                    busy={busy}
                    showActions={showActions}
                  />
                ))}
              </div>
            ) : (
              /* my-auto centers when there is room, without clipping on short viewports */
              <div className="my-auto py-8">
                <Hero />
                <div className="mt-9 mb-8">{composer(false)}</div>
                <HeroSuggestions onPrompt={submit} />
              </div>
            )}
          </div>
        </div>

        {inChat && (
          <ScrollToBottomButton
            visible={!atBottom}
            onClick={() => scrollToBottom({ smooth: true })}
          />
        )}
      </div>

      {inChat && (
        <div className="mx-auto w-full max-w-3xl px-5 pb-5 animate-fade-up">
          {composer(true)}
          <p className="mt-2.5 text-center text-xs text-ink-soft/80">{DISCLAIMER}</p>
        </div>
      )}
    </>
  )
}
