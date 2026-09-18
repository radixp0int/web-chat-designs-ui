import { useState } from 'react'
import { useCite } from '../../citations'
import { CopyIcon, RefreshIcon, ThumbDownIcon, ThumbUpIcon, CheckIcon } from '../icons'
import { IconButton } from '../icon-button'
import { Markdown } from '../markdown'
import { FollowupChips } from '../followup-chips'
import { SourceStrip } from '../source-strip'
import { ThinkingBlock } from '../thinking-block'
import { ToolCallChip } from '../tool-call-chip'
import { TurnTraceFailure, TurnTraceHandle, TurnTracePanel } from '../turn-trace'
import { useUiSize } from '../../uiSize'
import type { TurnTrace as Trace } from '../../types'
import type { ChatMessageProps } from './types'

export function ChatMessage({
  message,
  onFollowup,
  onRetry,
  busy,
  showActions = true,
}: ChatMessageProps) {
  const compact = useUiSize() === 'compact'
  const cite = useCite()
  // Opening a citation carries the message's highlights so the reference frame
  // can highlight the supporting passages inside the source doc.
  const onCite = (id: number) => message.sources && cite(message.sources, id, message.highlights)

  // A user message is only ever in the transcript because its turn has
  // started — anything still waiting lives in the queue dock, not here.
  if (message.role === 'user') {
    return (
      <div className="flex flex-col items-end animate-fade-up">
        <div
          className={`${
            compact
              ? 'max-w-[85%] rounded-lg rounded-br-xs bg-bubble px-3.5 py-2 text-sm leading-relaxed text-on-bubble shadow-md shadow-(color:--shadow-bubble)'
              : 'max-w-[78%] rounded-xl rounded-br-sm bg-bubble px-5 py-3 text-[15px] leading-relaxed text-on-bubble shadow-md shadow-(color:--shadow-bubble)'
          }`}
        >
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex animate-fade-up ${compact ? 'gap-2.5' : 'gap-3.5'}`}>
      <span
        className={`orb mt-1 block shrink-0 rounded-full ${compact ? 'size-6' : 'size-7'} ${message.streaming || message.thinkingActive ? 'animate-orb-drift' : ''}`}
        aria-hidden
      />
      <div className="min-w-0 flex-1 pt-0.5">
        {message.thinking && (
          <ThinkingBlock
            text={message.thinking}
            active={!!message.thinkingActive}
            durationSec={message.thinkingSec}
          />
        )}

        {message.tools && message.tools.length > 0 && (
          <div className="mb-3 flex flex-col items-start gap-1.5">
            {message.tools.map((tool) => (
              <ToolCallChip key={tool.toolCallId} tool={tool} />
            ))}
          </div>
        )}

        {message.content && (
          <div
            className={
              compact
                ? 'max-w-[68ch] text-sm leading-[1.65] text-ink'
                : 'max-w-[68ch] text-[15px] leading-[1.75] text-ink'
            }
          >
            <Markdown
              text={message.content}
              streaming={message.streaming}
              sources={message.sources}
              onCite={onCite}
            />
          </div>
        )}

        {message.stopped && (
          <p className={`mt-2 italic text-ink-soft ${compact ? 'text-[11px]' : 'text-xs'}`}>
            Stopped
          </p>
        )}

        {!message.streaming && message.sources && message.sources.length > 0 && (
          <SourceStrip sources={message.sources} onCite={onCite} />
        )}

        {/* Only a turn that produced no answer lands here — a recoverable
            hiccup is recorded on the trace instead, so a good answer is never
            wrapped in a red box. */}
        {message.error && (
          <TurnTraceFailure
            reason={message.error.message}
            trace={message.trace}
            onRetry={onRetry && (() => onRetry(message.id))}
            busy={busy}
          />
        )}

        {/* A failed turn is deliberately excluded: its own block owns the
            recovery action, and a Regenerate button sitting under a Retry makes
            two controls compete for the same job. Recovered turns are unaffected
            — a hiccup no longer sets `error`, so they keep their actions. */}
        {showActions &&
          !message.streaming &&
          !message.thinkingActive &&
          !message.error &&
          message.content && <ActionRow content={message.content} trace={message.trace} />}

        {onFollowup && !message.streaming && message.followups && message.followups.length > 0 && (
          <FollowupChips items={message.followups} onPick={onFollowup} disabled={busy} />
        )}
      </div>
    </div>
  )
}

function ActionRow({ content, trace }: { content: string; trace?: Trace }) {
  const compact = useUiSize() === 'compact'
  const [copied, setCopied] = useState(false)
  const [vote, setVote] = useState<'up' | 'down' | null>(null)
  // Held here rather than inside TurnTrace so the handle can sit at the row's
  // right edge while its panel expands full-width underneath.
  const [traceOpen, setTraceOpen] = useState(false)

  const iconSize = compact ? 14 : 15
  const actionSize = compact ? 'sm' : 'md'

  return (
    <div className="mt-3">
      {/* gap-1 rather than gap-0.5: the targets are 36px now, and abutting hit
          areas make a mis-tap land on the neighbouring action. */}
      <div className="flex items-center gap-1">
        <IconButton
          shape="rounded"
          size={actionSize}
          onClick={() => {
            navigator.clipboard?.writeText(content)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }}
          aria-label="Copy response"
          title="Copy"
        >
          {copied ? (
            <CheckIcon width={iconSize} height={iconSize} className="text-accent" />
          ) : (
            <CopyIcon width={iconSize} height={iconSize} />
          )}
        </IconButton>
        <IconButton
          shape="rounded"
          size={actionSize}
          aria-label="Regenerate response"
          title="Regenerate"
        >
          <RefreshIcon width={iconSize} height={iconSize} />
        </IconButton>
        <IconButton
          shape="rounded"
          size={actionSize}
          active={vote === 'up'}
          onClick={() => setVote(vote === 'up' ? null : 'up')}
          aria-label="Good response"
          aria-pressed={vote === 'up'}
          title="Good response"
        >
          <ThumbUpIcon width={iconSize} height={iconSize} />
        </IconButton>
        <IconButton
          shape="rounded"
          size={actionSize}
          active={vote === 'down'}
          onClick={() => setVote(vote === 'down' ? null : 'down')}
          aria-label="Poor response"
          aria-pressed={vote === 'down'}
          title="Poor response"
        >
          <ThumbDownIcon width={iconSize} height={iconSize} />
        </IconButton>

        {trace && (
          <div className="ml-auto">
            <TurnTraceHandle
              trace={trace}
              open={traceOpen}
              onToggle={() => setTraceOpen((o) => !o)}
            />
          </div>
        )}
      </div>

      {trace && <TurnTracePanel trace={trace} open={traceOpen} />}
    </div>
  )
}
