import { useRef, useState } from 'react'
import { useBranding } from '../../branding'
import { useAutoGrowTextarea } from '../../hooks/useAutoGrowTextarea'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'
import {
  CheckIcon,
  CollapseVerticalIcon,
  ExpandVerticalIcon,
  MicIcon,
  PaperclipIcon,
  PlusIcon,
  QueueIcon,
  SendIcon,
  StopIcon,
  XIcon,
} from '../icons'
import { IconButton } from '../icon-button'
import { PersonaMenu } from '../persona-menu'
import { useUiSize, type UiSize } from '../../uiSize'
import { keyLabels } from '../../keyLabels'
import type { ComposerProps } from './types'

// Textarea growth behavior per density. `expandThreshold` is the draft length
// at which the expand button appears; `expandedCap` is the max height while
// expanded. Compact caps are fixed because the widget panel is ~660px tall.
const SIZING: Record<
  UiSize,
  { expandThreshold: number; collapsed: number; expandedCap: () => number }
> = {
  default: {
    expandThreshold: 200,
    collapsed: 180,
    expandedCap: () => window.innerHeight * 0.65,
  },
  compact: {
    expandThreshold: 120,
    collapsed: 100,
    expandedCap: () => 240,
  },
}

export function Composer({
  docked,
  disabled = false,
  streaming = false,
  onStop,
  onSubmit,
  onArrowUp,
  personas,
  persona,
  onPersonaChange,
}: ComposerProps) {
  const { appName } = useBranding()
  const size = useUiSize()
  const compact = size === 'compact'
  const sizing = SIZING[size]

  const [value, setValue] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  const [expanded, setExpanded] = useState(false)

  const hasDraft = value.trim().length > 0
  const canExpand = value.length >= sizing.expandThreshold
  // Only honor the expanded state while the draft is long enough to warrant it.
  const expandedHeight = expanded && canExpand

  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useAutoGrowTextarea(value, expandedHeight, sizing)

  const speech = useSpeechRecognition({
    onResult: (chunk) => setValue((prev) => (prev ? `${prev} ${chunk}` : chunk)),
    onStart: () => textareaRef.current?.focus(),
  })

  function submit(opts?: { steer?: boolean }) {
    const text = value.trim()
    if (!text || disabled) return
    speech.stop()
    setValue('')
    setAttachments([])
    setExpanded(false)
    onSubmit(text, opts)
  }

  const toolIconSize = compact ? 16 : 18

  return (
    <div
      // Named so PersonaMenu (and anything else nested here) can query this
      // row's actual rendered width — e.g. when a resizable panel squeezes
      // the chat column — rather than the app-wide compact/default density.
      className={`glass @container/composer w-full shadow-lg shadow-(color:--shadow-soft) transition-shadow duration-300 focus-within:shadow-xl focus-within:shadow-(color:--shadow-raised) ${
        compact ? 'rounded-lg' : 'rounded-xl'
      } ${docked ? '' : 'shadow-xl'}`}
    >
      {attachments.length > 0 && (
        <div className={`flex flex-wrap gap-2 ${compact ? 'px-3 pt-2.5' : 'px-4 pt-3'}`}>
          {attachments.map((name) => (
            <span
              key={name}
              className={`flex items-center gap-1.5 rounded-full bg-chip py-0.5 pr-0.5 pl-3 font-medium text-chip-fg ${
                compact ? 'text-[11px]' : 'text-xs'
              }`}
            >
              <PaperclipIcon width={13} height={13} />
              <span className={compact ? 'max-w-28 truncate' : 'max-w-40 truncate'}>{name}</span>
              <IconButton
                size="sm"
                onClick={() => setAttachments((a) => a.filter((n) => n !== name))}
                aria-label={`Remove ${name}`}
              >
                <XIcon width={12} height={12} />
              </IconButton>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              // Cmd/Ctrl+Enter steers: interrupts the in-flight response and
              // sends immediately. Plain Enter queues while streaming.
              submit({ steer: e.metaKey || e.ctrlKey })
            } else if (e.key === 'ArrowUp' && value === '' && onArrowUp) {
              // Up on an empty box reaches for the last thing you wrote — here
              // that is the queue, not the history.
              e.preventDefault()
              onArrowUp()
            }
          }}
          rows={compact || docked ? 1 : 2}
          placeholder={speech.listening ? 'Listening…' : 'Ask anything…'}
          aria-label={`Message ${appName}`}
          className={`w-full resize-none bg-transparent pb-1 leading-relaxed text-ink-strong outline-none placeholder:text-ink-soft ${
            compact ? 'pt-3 pl-4 text-sm' : 'pt-4 pl-5 text-[15px]'
          } ${canExpand ? (compact ? 'pr-10' : 'pr-12') : compact ? 'pr-4' : 'pr-5'}`}
        />

        {canExpand && (
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            aria-pressed={expanded}
            aria-label={expanded ? 'Collapse input' : 'Expand input'}
            title={expanded ? 'Collapse' : 'Expand'}
            className={`absolute rounded-lg p-1.5 text-ink-soft transition hover:bg-tint/8 hover:text-ink-strong ${
              compact ? 'top-1.5 right-2' : 'top-2.5 right-3'
            }`}
          >
            {expanded ? (
              <CollapseVerticalIcon width={16} height={16} />
            ) : (
              <ExpandVerticalIcon width={16} height={16} />
            )}
          </button>
        )}
      </div>

      <div className={`flex items-center ${compact ? 'gap-1 px-2 pb-2' : 'gap-1.5 px-3 pb-3'}`}>
        <input
          ref={fileRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            const names = Array.from(e.target.files ?? []).map((f) => f.name)
            setAttachments((prev) => [...new Set([...prev, ...names])])
            e.target.value = ''
          }}
        />
        <IconButton
          size={compact ? 'md' : 'lg'}
          onClick={() => fileRef.current?.click()}
          aria-label="Attach files"
          title="Attach files"
        >
          <PlusIcon width={toolIconSize} height={toolIconSize} />
        </IconButton>

        {speech.supported && (
          <button
            type="button"
            onClick={speech.toggle}
            aria-pressed={speech.listening}
            aria-label={speech.listening ? 'Stop voice input' : 'Start voice input'}
            title="Voice to text"
            className={`relative rounded-full transition ${compact ? 'p-1.5' : 'p-2'} ${
              speech.listening
                ? 'bg-brand-fg/15 text-brand-fg'
                : 'text-ink-soft hover:bg-tint/8 hover:text-ink-strong'
            }`}
          >
            {speech.listening && (
              <span
                className="absolute inset-0 animate-ping rounded-full bg-brand-fg/30"
                aria-hidden
              />
            )}
            <MicIcon width={toolIconSize} height={toolIconSize} />
          </button>
        )}

        <PersonaMenu
          personas={personas}
          persona={persona}
          onChange={onPersonaChange}
          compact={compact}
        />

        {/* Stopping and sending are different intents, so they never share a
            button — but they do belong to each other, so they stay together at
            the action end of the row. Typing while an answer runs demotes Stop
            from filled to outline and slides it one place left; it never
            crosses the row, and the pointer that was on it has barely moved. */}
        <div className={`ml-auto flex items-center ${compact ? 'gap-1' : 'gap-1.5'}`}>
          {streaming && hasDraft && (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop the reply"
              title="Stop the reply"
              className={`flex items-center justify-center rounded-full border border-line text-ink-strong transition hover:bg-tint/8 ${
                compact ? 'size-8' : 'size-9'
              }`}
            >
              <StopIcon width={compact ? 14 : 15} height={compact ? 14 : 15} />
            </button>
          )}

          {streaming && !hasDraft ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Stop response"
              title="Stop response"
              className={`flex items-center justify-center rounded-full bg-action text-on-action shadow-md shadow-(color:--shadow-raised) transition hover:brightness-95 ${
                compact ? 'size-8' : 'size-9'
              }`}
            >
              <StopIcon width={compact ? 16 : 18} height={compact ? 16 : 18} />
            </button>
          ) : streaming ? (
            <SendControl
              compact={compact}
              onQueue={() => submit()}
              onSendNow={() => submit({ steer: true })}
            />
          ) : (
            <button
              type="button"
              onClick={() => submit()}
              disabled={!hasDraft || disabled}
              aria-label="Send message"
              // Disabled drops to the neutral wash rather than fading the fill.
              // --action is ember on dark (brand.css §2), and a saturated orange
              // at 35% opacity over a navy panel does not read as a dimmed
              // button — it composites to brown, which looks like a different
              // control rather than an unavailable one.
              className={`flex items-center justify-center rounded-full bg-action text-on-action shadow-md shadow-(color:--shadow-raised) transition hover:brightness-95 disabled:bg-tint/15 disabled:text-ink-soft disabled:shadow-none ${
                compact ? 'size-8' : 'size-9'
              }`}
            >
              <SendIcon width={compact ? 16 : 18} height={compact ? 16 : 18} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * The primary action while an answer is running.
 *
 * One button, not two. Queue and Send now are both real choices, but only one
 * of them is what you usually mean — so the button does that, and the other
 * sits a hover (or a focus, or a long press) away, named, with its key beside
 * it. Two buttons of equal weight made the row ask a question on every
 * keystroke; this one answers it and stays out of the way.
 */
function SendControl({
  compact,
  onQueue,
  onSendNow,
}: {
  compact: boolean
  onQueue: () => void
  onSendNow: () => void
}) {
  const [open, setOpen] = useState(false)
  const holdRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  // Escape closes the list and hands focus back to the button — whose focus
  // handler would open it straight back up. This swallows that one re-open.
  const dismissedRef = useRef(false)

  const cancelHold = () => {
    if (holdRef.current) clearTimeout(holdRef.current)
    holdRef.current = null
  }

  /** Walk the open menu. Hover opens this list too, so focus is only ever
   *  moved by a key — a pointer passing over the button must not steal it
   *  from the draft the reader is still typing. */
  const step = (delta: 1 | -1) => {
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [],
    )
    if (items.length === 0) return
    const at = items.indexOf(document.activeElement as HTMLButtonElement)
    const next =
      at === -1 ? (delta === 1 ? 0 : items.length - 1) : (at + delta + items.length) % items.length
    items[next].focus()
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => {
        dismissedRef.current = false
        setOpen(false)
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          setOpen(false)
          dismissedRef.current = true
          triggerRef.current?.focus()
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault()
          setOpen(true)
          // The list has to exist before focus can land in it.
          requestAnimationFrame(() => step(e.key === 'ArrowDown' ? 1 : -1))
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={onQueue}
        onFocus={() => {
          if (dismissedRef.current) {
            dismissedRef.current = false
            return
          }
          setOpen(true)
        }}
        // Touch has no hover: a long press opens the same list.
        onPointerDown={(e) => {
          if (e.pointerType !== 'touch') return
          holdRef.current = setTimeout(() => setOpen(true), 450)
        }}
        onPointerUp={cancelHold}
        onPointerCancel={cancelHold}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Queue this message"
        title={`Queue (${keyLabels.enter}) · Send now (${keyLabels.mod}${keyLabels.enter})`}
        className={`flex items-center justify-center rounded-full bg-action text-on-action shadow-md shadow-(color:--shadow-raised) transition hover:brightness-95 ${
          compact ? 'size-8' : 'size-9'
        }`}
      >
        <QueueIcon width={compact ? 15 : 17} height={compact ? 15 : 17} />
      </button>
      {open && (
        // The wrapper carries the gap as padding so crossing from button to
        // menu never leaves the hover target.
        <div ref={menuRef} className="absolute right-0 bottom-full z-30 pb-2">
          <div
            role="menu"
            aria-label="Send options"
            className="w-52 overflow-hidden rounded-lg border border-line bg-panel-solid p-1.5 shadow-xl shadow-(color:--shadow-menu)"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onQueue()
              }}
              className="flex w-full items-center gap-2.5 rounded-md bg-chip/60 px-2.5 py-2 text-left transition hover:bg-chip"
            >
              <CheckIcon width={14} height={14} className="shrink-0 text-accent" />
              <span className="flex-1 text-[13px] font-bold text-ink-strong">Queue</span>
              <span className="text-[11px] font-bold text-ink-soft">{keyLabels.enter}</span>
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onSendNow()
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition hover:bg-tint/8"
            >
              <SendIcon width={14} height={14} className="shrink-0 text-ink-soft" />
              <span className="flex-1 text-[13px] text-ink-strong">Send now</span>
              <span className="text-[11px] font-bold text-ink-soft">
                {keyLabels.mod}
                {keyLabels.enter}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
