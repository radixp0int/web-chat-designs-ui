import { useMemo, useRef } from 'react'
import { DISCLAIMER } from '../config'
import type {
  ChainControls,
  ComposerFeatures,
  Message,
  QueueMove,
  QueuedMessage,
  Suggestion,
} from '../../lib/types'
import { ChatMessage } from '../../lib/components/chat-message'
import type { AskedOverChip, AskedOverScope } from '../../lib/types'
import { Composer } from '../../lib/components/composer'
import { QueueDock, type QueueDockHandle } from '../../lib/components/queue-dock'
import { SuggestedQuestions } from '../../lib/components/suggestions'
import { ScrollToBottomButton } from '../../lib/components/scroll-to-bottom-button'
import { useStickToBottom } from '../../lib/hooks/useStickToBottom'
import { Hero } from './Hero'

type ConversationViewProps = {
  messages: Message[]
  busy: boolean
  /** Messages written but not yet run — the dock above the composer. */
  queue: QueuedMessage[]
  held: boolean
  onSubmit: (text: string) => void
  onStop: () => void
  onSendNow: (text: string) => void
  /** Filters in force now — a question recorded under different ones says so. */
  scopeChips?: AskedOverChip[]
  onRestoreScope?: (scope: AskedOverScope) => void
  onSendQueuedNow: (id: number) => void
  onEditQueued: (id: number, text: string) => void
  onMoveQueued: (id: number, to: QueueMove) => void
  onRemoveQueued: (id: number) => void
  onHold: () => void
  onResume: () => void
  onCombineQueue: () => void
  onClearQueue: () => void
  onRetry: (id: number) => void
  /** The chain being built or run, and its controls. */
  chain: ChainControls
  /** Composer features switched on for this viewer. */
  features?: ComposerFeatures
  /** Today's suggested questions, and more for suggest-as-you-type. */
  suggestions: Suggestion[]
  typeaheadPool?: Suggestion[]
  /** Demo toggle: the copy / regenerate / vote row under a finished answer. */
  showActions?: boolean
}

/**
 * The center column: the greeting hero before the first message, the message
 * list after, and the composer — centered at first, then docked to the bottom.
 */
export function ConversationView({
  messages,
  busy,
  queue,
  held,
  onSubmit,
  onStop,
  onSendNow,
  scopeChips,
  onRestoreScope,
  onSendQueuedNow,
  onEditQueued,
  onMoveQueued,
  onRemoveQueued,
  onHold,
  onResume,
  onCombineQueue,
  onClearQueue,
  onRetry,
  chain,
  features = {},
  suggestions,
  typeaheadPool,
  showActions = true,
}: ConversationViewProps) {
  const dockRef = useRef<QueueDockHandle>(null)
  const { containerRef, contentRef, atBottom, scrollToBottom } = useStickToBottom()
  const inChat = messages.length > 0
  // Only the newest turn offers follow-ups, so branches don't stack up the thread.
  const lastId = messages[messages.length - 1]?.id
  // The discoverability tip belongs on the first answer that actually has
  // something to click — not every cited message, or it'd pile up.
  const firstCitedId = messages.find((m) => m.sources && m.sources.length > 0)?.id

  // A message the reader sends themselves always comes into view, even if
  // they'd scrolled up to reread earlier turns — streamed replies then keep
  // following automatically because this also re-arms `atBottom`.
  const submit = (text: string) => {
    onSubmit(text)
    scrollToBottom()
  }

  const queueOn = features.queue !== false
  const suggestOn = features.suggestions !== false
  // Running a chain puts its first question on screen, so bring it into view.
  const chainControls = useMemo<ChainControls>(
    () => ({
      ...chain,
      run: () => {
        chain.run()
        scrollToBottom()
      },
    }),
    [chain, scrollToBottom],
  )

  const composer = (docked: boolean) => (
    <Composer
      docked={docked}
      streaming={busy}
      onStop={onStop}
      onSubmit={(text, opts) => {
        if (opts?.steer) {
          onSendNow(text)
          scrollToBottom()
        } else {
          submit(text)
        }
      }}
      onArrowUp={() => dockRef.current?.focusLast()}
      // The empty state lays today's suggestions out above the composer, so
      // the sparkle menu and the queue only arrive once the chat has begun.
      suggestions={docked && suggestOn ? suggestions : undefined}
      typeaheadPool={typeaheadPool}
      typeaheadStorageKey="composer-typeahead:conversation"
      queueing={queueOn}
      chain={docked && queueOn ? chainControls : undefined}
    />
  )

  const dock = (
    <QueueDock
      ref={dockRef}
      items={queue}
      held={held}
      busy={busy}
      storageKey="queue-dock-minimized:conversation"
      onSendNow={onSendQueuedNow}
      onEdit={onEditQueued}
      onMove={onMoveQueued}
      onRemove={onRemoveQueued}
      onHold={onHold}
      onResume={onResume}
      onCombine={onCombineQueue}
      onClear={onClearQueue}
      chain={queueOn ? chainControls : undefined}
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
                    onRetry={onRetry}
                    onFollowup={m.id === lastId ? submit : undefined}
                    busy={busy}
                    showActions={showActions}
                    scopeChips={scopeChips}
                    onRestoreScope={onRestoreScope}
                    showSourceTip={m.id === firstCitedId}
                  />
                ))}
              </div>
            ) : (
              /* my-auto centers when there is room, without clipping on short viewports */
              <div className="my-auto py-8">
                <Hero />
                <div className="mt-9 mb-8 flex flex-col gap-4">
                  <SuggestedQuestions suggestions={suggestions} onPick={submit} />
                  {composer(false)}
                </div>
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
          {dock}
          {composer(true)}
          <p className="mt-2.5 text-center text-xs text-ink-soft/80">{DISCLAIMER}</p>
        </div>
      )}
    </>
  )
}
