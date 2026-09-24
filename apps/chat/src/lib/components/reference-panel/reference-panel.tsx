import { useEffect, useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon, ExternalLinkIcon, XIcon } from '../icons'
import { IconButton } from '../icon-button'
import { Markdown } from '../markdown'
import { useUiSize } from '../../uiSize'
import { useWheelToHorizontal } from '../../hooks/useWheelToHorizontal'
import type { ReferencePanelProps } from './types'

// Above this many sources, the pill rail alone is a long horizontal scroll, so
// the row also gets a jump-to-number box for landing on a distant reference in
// one gesture.
const JUMP_THRESHOLD = 12

// The rail fades out at its own right edge rather than stopping abruptly, so
// "there's more, scroll" reads as a property of the row instead of a guess —
// same idea at 3 sources or 50, no extra affordance to add as the count grows.
const RAIL_FADE = {
  maskImage: 'linear-gradient(to right, black calc(100% - 32px), transparent 100%)',
  WebkitMaskImage: 'linear-gradient(to right, black calc(100% - 32px), transparent 100%)',
} as const

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

  // A wheel mouse has no sideways gesture, so the pill rail would be
  // unreachable with one past the first few references.
  useWheelToHorizontal(railRef)

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

  // "PDF · 12 pages · Updated Mar 2026" — only the parts a source actually has.
  const meta = [
    active.fileType,
    active.pageCount != null ? `${active.pageCount} pages` : undefined,
    active.updatedLabel ? `Updated ${active.updatedLabel}` : undefined,
  ]
    .filter(Boolean)
    .join(' · ')

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
      <div className="flex items-center gap-2.5 border-b border-line px-3 py-2.5">
        {backLabel && (
          <IconButton onClick={onClose} aria-label={backLabel} title={backLabel}>
            <ChevronLeftIcon width={16} height={16} />
          </IconButton>
        )}
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-center gap-1.5 font-semibold text-ink-strong">
            <span
              aria-hidden
              className="grid size-[18px] shrink-0 place-items-center rounded-md bg-brand-solid text-[10px] font-bold text-on-brand-solid"
            >
              {active.id}
            </span>
            <span className={`min-w-0 flex-1 truncate ${compact ? 'text-[13px]' : 'text-sm'}`}>
              {active.title}
            </span>
          </p>
          {meta && <p className="mt-0.5 truncate pl-[25px] text-[11px] text-ink-soft">{meta}</p>}
        </div>
        {active.url && (
          <a
            href={active.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-brand-fg/25 bg-brand-fg/7 px-2.5 py-1.5 text-xs font-semibold whitespace-nowrap text-brand-fg transition hover:bg-brand-fg/12"
          >
            <ExternalLinkIcon width={12} height={12} />
            Open original
          </a>
        )}
        <div className="flex shrink-0 items-center gap-0.5">
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
      </div>

      {sources.length > 1 && (
        <div className="flex items-center gap-4 border-b border-line px-3 py-2">
          <div
            ref={railRef}
            style={RAIL_FADE}
            className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto overscroll-x-contain [scrollbar-width:thin]"
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
                      ? 'bg-brand-solid text-on-brand-solid'
                      : 'border border-line text-ink-soft hover:bg-tint/8 hover:text-ink-strong'
                  }`}
                >
                  {source.id}
                </button>
              )
            })}
          </div>
          {showJump && (
            <>
              <span aria-hidden className="h-[18px] w-px shrink-0 bg-line" />
              <div className="flex shrink-0 items-center gap-1 rounded-lg border border-line px-1.5 py-1 text-xs text-ink-soft">
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
                  className="w-7 bg-transparent text-center font-semibold text-ink-strong tabular-nums outline-none"
                />
                <span className="tabular-nums">/ {sources.length}</span>
              </div>
            </>
          )}
        </div>
      )}

      <div
        ref={bodyRef}
        className={`min-h-0 flex-1 overflow-y-auto text-ink ${
          compact ? 'px-4 py-3.5 text-sm leading-[1.65]' : 'px-5 py-4 text-[15px] leading-[1.75]'
        }`}
      >
        <Markdown text={active.markdown} highlights={highlights} activeRef={active.id} />
      </div>
    </div>
  )
}
