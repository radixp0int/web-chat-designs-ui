import { useState } from 'react'
import type { Message } from '../engine/chatEngine'
import { useCite } from '../citations'
import { CopyIcon, RefreshIcon, ThumbDownIcon, ThumbUpIcon, CheckIcon } from './Icons'
import { IconButton } from './IconButton'
import { Markdown } from './Markdown'
import { SourceStrip } from './SourceStrip'
import { ThinkingBlock } from './ThinkingBlock'
import { ToolCallChip } from './ToolCallChip'
import { useUiSize } from '../uiSize'

export function ChatMessage({ message }: { message: Message }) {
  const compact = useUiSize() === 'compact'
  const cite = useCite()
  const onCite = (id: number) => message.sources && cite(message.sources, id)

  if (message.role === 'user') {
    return (
      <div className="flex justify-end animate-fade-up">
        <div
          className={
            compact
              ? 'max-w-[85%] rounded-2xl rounded-br-md bg-(--bubble-user) px-3.5 py-2 text-sm leading-relaxed text-white shadow-md shadow-brand-600/20'
              : 'max-w-[78%] rounded-3xl rounded-br-lg bg-(--bubble-user) px-5 py-3 text-[15px] leading-relaxed text-white shadow-md shadow-brand-600/20'
          }
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
                ? 'max-w-[68ch] text-sm leading-[1.65] text-(--text-body)'
                : 'max-w-[68ch] text-[15px] leading-[1.75] text-(--text-body)'
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

        {!message.streaming && message.sources && message.sources.length > 0 && (
          <SourceStrip sources={message.sources} onCite={onCite} />
        )}

        {message.error && (
          <div
            role="alert"
            className={`mt-3 rounded-2xl border border-red-500/30 bg-red-500/8 text-red-700 dark:text-red-300 ${
              compact ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-[13px]'
            }`}
          >
            <span className="font-medium">
              {message.error.recoverable ? 'Hiccup in the stream. ' : 'Something went wrong. '}
            </span>
            {message.error.message}
          </div>
        )}

        {!message.streaming && !message.thinkingActive && !message.error && message.content && (
          <ActionRow content={message.content} />
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
          <CheckIcon width={iconSize} height={iconSize} className="text-accent-500" />
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
