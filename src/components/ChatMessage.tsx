import { useState } from 'react'
import type { Message } from '../lib/chatEngine'
import { CopyIcon, RefreshIcon, ThumbDownIcon, ThumbUpIcon, CheckIcon } from './Icons'
import { ThinkingBlock } from './ThinkingBlock'
import { useUiSize } from './uiSize'

export function ChatMessage({ message }: { message: Message }) {
  const compact = useUiSize() === 'compact'

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

        {message.content && (
          <div
            className={
              compact
                ? 'max-w-[68ch] text-sm leading-[1.65] whitespace-pre-line text-(--text-body)'
                : 'max-w-[68ch] text-[15px] leading-[1.75] whitespace-pre-line text-(--text-body)'
            }
          >
            {message.content}
            {message.streaming && <span className="text-accent-500">▍</span>}
          </div>
        )}

        {!message.streaming && !message.thinkingActive && message.content && (
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
  const actionClass = `rounded-lg text-(--text-soft) transition hover:bg-brand-600/8 hover:text-(--text-strong) dark:hover:bg-white/8 ${compact ? 'p-1' : 'p-1.5'}`

  return (
    <div className="mt-3 flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(content)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }}
        className={actionClass}
        aria-label="Copy response"
        title="Copy"
      >
        {copied ? (
          <CheckIcon width={iconSize} height={iconSize} className="text-accent-500" />
        ) : (
          <CopyIcon width={iconSize} height={iconSize} />
        )}
      </button>
      <button type="button" className={actionClass} aria-label="Regenerate response" title="Regenerate">
        <RefreshIcon width={iconSize} height={iconSize} />
      </button>
      <button
        type="button"
        onClick={() => setVote(vote === 'up' ? null : 'up')}
        className={`${actionClass} ${vote === 'up' ? 'text-accent-500' : ''}`}
        aria-label="Good response"
        aria-pressed={vote === 'up'}
        title="Good response"
      >
        <ThumbUpIcon width={iconSize} height={iconSize} />
      </button>
      <button
        type="button"
        onClick={() => setVote(vote === 'down' ? null : 'down')}
        className={`${actionClass} ${vote === 'down' ? 'text-accent-500' : ''}`}
        aria-label="Poor response"
        aria-pressed={vote === 'down'}
        title="Poor response"
      >
        <ThumbDownIcon width={iconSize} height={iconSize} />
      </button>
    </div>
  )
}
