import { QueueIcon } from '../icons'
import type { QueueToggleProps } from './types'

/**
 * The composer's way into the queue: starts building a chain — questions that
 * run one after another — or stops building one. Icon-only in compact
 * density; elsewhere labelled once the ancestor `@container/composer` is wide
 * enough.
 */
export function QueueToggle({ compact, pressed, onClick }: QueueToggleProps) {
  const label = pressed ? 'Stop building the chain' : 'Queue a chain of questions'
  const tone = pressed
    ? 'border-transparent bg-chip text-chip-fg hover:bg-chip-hover'
    : 'border-line text-ink-soft hover:bg-tint/8 hover:text-ink-strong'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      aria-label={label}
      title={label}
      className={`flex items-center justify-center rounded-full border transition ${tone} ${
        compact ? 'size-8' : 'h-9 gap-1.5 px-2.5 text-[13px] font-semibold @sm/composer:px-3'
      }`}
    >
      <QueueIcon width={compact ? 15 : 16} height={compact ? 15 : 16} />
      {!compact && <span className="hidden @sm/composer:inline">Queue</span>}
    </button>
  )
}
