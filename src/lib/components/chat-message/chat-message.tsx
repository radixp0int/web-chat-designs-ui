import { useState } from 'react'
import { useCite } from '../../citations'
import { CopyIcon, RefreshIcon, ThumbDownIcon, ThumbUpIcon, CheckIcon, XIcon } from '../icons'
import { IconButton } from '../icon-button'
import { Markdown } from '../markdown'
import { FollowupChips } from '../followup-chips'
import { SourceStrip } from '../source-strip'
import { ThinkingBlock } from '../thinking-block'
import { ToolCallChip } from '../tool-call-chip'
import { useUiSize } from '../../uiSize'
import type { ChatMessageProps } from './types'

export function ChatMessage({
  message,
  onRemoveQueued,
  onFollowup,
  busy,
  showActions = true,
}: ChatMessageProps) {
  const compact = useUiSize() === 'compact'
  const cite = useCite()
  // Opening a citation carries the message's highlights so the reference frame
  // can highlight the supporting passages inside the source doc.
  const onCite = (id: number) => message.sources && cite(message.sources, id, message.highlights)

  if (message.role === 'user') {
    return (
      <div className="flex flex-col items-end animate-fade-up">
        <div
          className={`${
            compact
              ? 'max-w-[85%] rounded-2xl rounded-br-md bg-bubble px-3.5 py-2 text-sm leading-relaxed text-on-bubble shadow-md shadow-(color:--shadow-bubble)'
              : 'max-w-[78%] rounded-3xl rounded-br-lg bg-bubble px-5 py-3 text-[15px] leading-relaxed text-on-bubble shadow-md shadow-(color:--shadow-bubble)'
          } ${message.queued ? 'opacity-60' : ''}`}
        >
          {message.content}
        </div>
        {message.queued && (
          <div className="mt-1 flex items-center gap-1 text-[11px] text-ink-soft">
            <span>Queued</span>
            {onRemoveQueued && (
              <button
                type="button"
                onClick={() => onRemoveQueued(message.id)}
                aria-label="Remove from queue"
                title="Remove from queue"
                className="rounded-full p-0.5 transition hover:bg-tint/10 hover:text-ink-strong"
              >
                <XIcon width={12} height={12} />
              </button>
            )}
          </div>
        )}
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

        {message.error && (
          <div
            role="alert"
            className={`mt-3 rounded-2xl border border-danger/30 bg-danger/8 text-danger-fg ${
              compact ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-[13px]'
            }`}
          >
            <span className="font-medium">
              {message.error.recoverable ? 'Hiccup in the stream. ' : 'Something went wrong. '}
            </span>
            {message.error.message}
          </div>
        )}

        {showActions &&
          !message.streaming &&
          !message.thinkingActive &&
          !message.error &&
          message.content && <ActionRow content={message.content} />}

        {onFollowup && !message.streaming && message.followups && message.followups.length > 0 && (
          <FollowupChips items={message.followups} onPick={onFollowup} disabled={busy} />
        )}
      </div>
    </div>
  )
}

function ActionRow({ content }: { content: string }) {
  const compact = useUiSize() === 'compact'
  const [copied, setCopied] = useState(false)
  const [vote, setVote] = useState<'up' | 'down' | null>(null)

  const iconSize = compact ? 14 : 15
  const actionSize = compact ? 'sm' : 'md'

  return (
    <div className="mt-3 flex items-center gap-0.5">
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
    </div>
  )
}
