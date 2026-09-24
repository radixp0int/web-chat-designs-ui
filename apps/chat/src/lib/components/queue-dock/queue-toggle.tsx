import { QueueIcon } from '../icons'
import type { QueueToggleProps } from './types'

/**
 * The composer's way into the queue: starts building a queue — questions that
 * run one after another — or stops building one.
 *
 * The word rides along at every width, compact included. Stripped of it this
 * button is a glyph in the send cluster, which is exactly how it came to be
 * read as a second way to send; the label is the part that fixed that, and the
 * title says the whole thing once, for anyone who hovers.
 */
export function QueueToggle({ compact, pressed, onClick }: QueueToggleProps) {
  const label = pressed ? 'Stop building the queue' : 'Queue a question'
  const title = pressed
    ? 'Stop building — questions you added stay queued and paused'
    : 'Queue a question — it runs after this reply. Send interrupts instead.'
  const tone = pressed
    ? 'border-transparent bg-chip text-chip-fg hover:bg-chip-hover'
    : 'border-line text-ink-soft hover:bg-tint/8 hover:text-ink-strong'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      aria-label={label}
      title={title}
      className={`flex items-center justify-center gap-1.5 rounded-full border font-semibold transition ${tone} ${
        compact ? 'h-8 px-2 text-[12px]' : 'h-9 px-2.5 text-[13px] @sm/composer:px-3'
      }`}
    >
      <QueueIcon width={compact ? 15 : 16} height={compact ? 15 : 16} />
      <span>{pressed ? 'Queueing' : 'Queue'}</span>
    </button>
  )
}
