import { useEffect, useRef, useState } from 'react'
import type { Highlight, Source } from '../types'
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from './Icons'
import { IconButton } from './IconButton'
import { Markdown } from './Markdown'
import { useUiSize } from '../uiSize'

// Above this many sources, the pill rail alone is a long horizontal scroll, so
// the header also gets a jump-to-number box for landing on a distant reference
// in one gesture.
const JUMP_THRESHOLD = 12

type ReferencePanelProps = {
  sources: Source[]
  activeId: number
  onSelect: (id: number) => void
  onClose: () => void
  /** Supporting passages to highlight, keyed by source id (referenceNumber). */
  highlights?: Highlight[]
  /** When set (mobile widget slide-over), the close control becomes a back button. */
  backLabel?: string
}

/**
 * The markdown frame: renders one reference document with fast navigation
 * between all of a message's sources — prev/next, a numbered pill rail,
 * and arrow-key support, so jumping from reference 2 to 21 is one gesture.
 */
export function ReferencePanel({
  sources,
  activeId,
  onSelect,
  onClose,
  highlights,
  backLabel,
}: ReferencePanelProps) {
  const compact = useUiSize() === 'compact'
  const rootRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  const at = sources.findIndex((s) => s.id === activeId)
  const active = sources[at] ?? sources[0]
  const prev = at > 0 ? sources[at - 1] : undefined
  const next = at >= 0 && at < sources.length - 1 ? sources[at + 1] : undefined
  const showJump = sources.length > JUMP_THRESHOLD

  // Draft for the jump box; mirrors the active reference until the user edits.
  const [jumpDraft, setJumpDraft] = useState(String(active.id))
  useEffect(() => {
    setJumpDraft(String(active.id))
  }, [active.id])

  // Commit a jump by the [n] marker number; revert the draft if it's unknown.
  const commitJump = () => {
    const target = sources.find((s) => s.id === Number(jumpDraft))
    if (target) onSelect(target.id)
    else setJumpDraft(String(active.id))
  }

  // Take focus when the frame opens so arrow keys work immediately.
  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true })
  }, [])

  // Keep the active pill visible and, on change, jump to the first highlighted
  // passage if there is one (else restart reading from the top).
  useEffect(() => {
    railRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' })
    const mark = bodyRef.current?.querySelector('[data-hl]')
    if (mark) mark.scrollIntoView({ block: 'center', behavior: 'smooth' })
    else bodyRef.current?.scrollTo({ top: 0 })
  }, [activeId])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && prev) onSelect(prev.id)
    else if (e.key === 'ArrowRight' && next) onSelect(next.id)
    else if (e.key === 'Escape') onClose()
    else return
    e.preventDefault()
  }

  return (
    <div
      ref={rootRef}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      aria-label={`Reference ${active.id}: ${active.title}`}
      className="flex min-h-0 flex-1 flex-col outline-none"
    >
      <div className="flex items-center gap-1.5 border-b border-(--panel-border) px-3 py-2.5">
        {backLabel && (
          <IconButton onClick={onClose} aria-label={backLabel} title={backLabel}>
            <ChevronLeftIcon width={16} height={16} />
          </IconButton>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold tracking-wide text-(--text-soft) uppercase">
            Reference {active.id}
          </p>
          <p
            className={`truncate font-semibold text-(--text-strong) ${compact ? 'text-[13px]' : 'text-sm'}`}
          >
            {active.title}
          </p>
        </div>
        {showJump && (
          <div className="flex items-center gap-1 rounded-lg border border-(--panel-border) px-1.5 py-1 text-xs text-(--text-soft)">
            <input
              aria-label="Jump to reference number"
              title="Jump to reference"
              inputMode="numeric"
              value={jumpDraft}
              onChange={(e) => setJumpDraft(e.target.value.replace(/\D/g, ''))}
              onFocus={(e) => e.currentTarget.select()}
              onBlur={commitJump}
              onKeyDown={(e) => {
                // Keep typing (incl. arrows) from reaching the panel's nav keys.
                e.stopPropagation()
                if (e.key === 'Enter') commitJump()
                else if (e.key === 'Escape') setJumpDraft(String(active.id))
              }}
              className="w-7 bg-transparent text-center font-semibold text-(--text-strong) tabular-nums outline-none"
            />
            <span className="tabular-nums">/ {sources.length}</span>
          </div>
        )}
        <IconButton
          onClick={() => prev && onSelect(prev.id)}
          disabled={!prev}
          aria-label="Previous reference"
          title="Previous reference"
        >
          <ChevronLeftIcon width={16} height={16} />
        </IconButton>
        <IconButton
          onClick={() => next && onSelect(next.id)}
          disabled={!next}
          aria-label="Next reference"
          title="Next reference"
        >
          <ChevronRightIcon width={16} height={16} />
        </IconButton>
        {!backLabel && (
          <IconButton onClick={onClose} aria-label="Close references" title="Close">
            <XIcon width={16} height={16} />
          </IconButton>
        )}
      </div>

      {sources.length > 1 && (
        <div
          ref={railRef}
          className="flex gap-1.5 overflow-x-auto border-b border-(--panel-border) px-3 py-2 [scrollbar-width:thin]"
          role="tablist"
          aria-label="References"
        >
          {sources.map((source) => {
            const isActive = source.id === active.id
            return (
              <button
                key={source.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                data-active={isActive || undefined}
                onClick={() => onSelect(source.id)}
                title={source.title}
                className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition ${
                  isActive
                    ? 'bg-brand-600 text-white dark:bg-brand-300 dark:text-brand-950'
                    : 'border border-(--panel-border) text-(--text-soft) hover:bg-brand-600/8 hover:text-(--text-strong) dark:hover:bg-white/8'
                }`}
              >
                {source.id}
              </button>
            )
          })}
        </div>
      )}

      <div
        ref={bodyRef}
        className={`min-h-0 flex-1 overflow-y-auto text-(--text-body) ${
          compact ? 'px-4 py-3.5 text-sm leading-[1.65]' : 'px-5 py-4 text-[15px] leading-[1.75]'
        }`}
      >
        <Markdown text={active.markdown} highlights={highlights} activeRef={active.id} />
      </div>
    </div>
  )
}
