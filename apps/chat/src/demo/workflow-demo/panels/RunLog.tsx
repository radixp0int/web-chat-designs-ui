// The run log: what the backend says is happening, as it happens.
//
// A drawer under the canvas rather than a third column, so you can watch a line
// arrive and the node it names change colour in the same glance. Like the two
// side panels it animates its height rather than unmounting, which keeps React
// Flow re-measuring smoothly instead of snapping.
import { useEffect } from 'react'
import { XIcon } from '../../../lib/components/icons'
import { IconButton } from '../../../lib/components/icon-button'
import { ScrollToBottomButton } from '../../../lib/components/scroll-to-bottom-button'
import { useStickToBottom } from '../../../lib/hooks/useStickToBottom'
import type { LogEntry } from '../run'
import { SectionLabel } from './SectionLabel'

export const LOG_HEIGHT = 240

/** Elapsed time, the way the inspector's "How it got here" list writes it. */
function elapsed(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/* Level is carried by a dot and, for a failure, by the text colour.
   Deliberately no orange: brand.css reserves --notify for "a person is being
   waited on", and in this single-hue palette --notify falls back to --accent
   anyway, so borrowing either would make a human line indistinguishable from
   the pill that actually means it. A person's line stands out by weight. */
const LEVEL_DOT: Record<LogEntry['level'], string> = {
  info: 'bg-ink-soft/50',
  warn: 'bg-ink-soft',
  error: 'bg-danger-fg',
  human: 'bg-ink-strong',
}

export function RunLog({
  entries,
  trimmed,
  open,
  stepTitles,
  onSelectStep,
  onClose,
}: {
  entries: LogEntry[]
  /** How many older lines the cap dropped. */
  trimmed: number
  open: boolean
  /** Step id → title, so a line can be attributed to the step it names. */
  stepTitles: Map<string, string>
  onSelectStep: (id: string) => void
  onClose: () => void
}) {
  const { containerRef, contentRef, atBottom, scrollToBottom } = useStickToBottom({ threshold: 48 })

  // While closed the container is zero-height, so the ResizeObserver never fires
  // and the list would open scrolled to the top — on the oldest line, which is
  // the least interesting one.
  useEffect(() => {
    if (open) scrollToBottom()
  }, [open, scrollToBottom])

  return (
    <div
      id="wf-run-log"
      className={`shrink-0 overflow-hidden border-t border-line transition-[height] duration-300 ease-out ${
        open ? '' : 'border-t-0'
      }`}
      style={{ height: open ? LOG_HEIGHT : 0 }}
    >
      <div className="flex w-full flex-col" style={{ height: LOG_HEIGHT }}>
        <div className="flex h-10 shrink-0 items-center gap-2.5 border-b border-line pr-2.5 pl-5">
          <SectionLabel>Run log</SectionLabel>
          <span className="text-xs text-ink-soft tabular-nums">
            {entries.length} {entries.length === 1 ? 'line' : 'lines'}
          </span>
          <IconButton
            onClick={onClose}
            className="ml-auto"
            aria-label="Hide run log"
            title="Hide run log"
          >
            <XIcon width={14} height={14} />
          </IconButton>
        </div>

        <div className="relative min-h-0 flex-1">
          <div ref={containerRef} className="h-full overflow-y-auto px-5 py-2.5">
            {/* The hook observes this wrapper's height; the <ol> is what the
                list semantics need, so they are two elements rather than one. */}
            <div ref={contentRef}>
              <ol className="flex flex-col gap-px">
                {trimmed > 0 && (
                  <li className="px-2 py-1 text-xs text-ink-soft">
                    {trimmed} earlier {trimmed === 1 ? 'line' : 'lines'} trimmed
                  </li>
                )}
                {entries.length === 0 && (
                  <li className="px-2 py-1 text-[13px] text-ink-soft">
                    Nothing has happened in this run yet.
                  </li>
                )}
                {entries.map((entry) => {
                  const source = (entry.stepId && stepTitles.get(entry.stepId)) || entry.source
                  const body = (
                    <>
                      <span className="w-9 shrink-0 font-mono text-xs text-ink-soft tabular-nums">
                        {elapsed(entry.elapsedMs)}
                      </span>
                      <span
                        className={`mt-[7px] size-1.5 shrink-0 rounded-full ${LEVEL_DOT[entry.level]}`}
                        aria-hidden
                      />
                      {source && (
                        <span className="w-40 shrink-0 truncate text-xs font-semibold text-ink">
                          {source}
                        </span>
                      )}
                      <span
                        className={`min-w-0 flex-1 text-[13px] leading-5 ${
                          entry.level === 'error' ? 'text-danger-fg' : 'text-ink-soft'
                        }`}
                      >
                        {entry.text}
                      </span>
                    </>
                  )
                  // Keyed on the entry id, never the index — the cap drops from the head.
                  return entry.stepId && stepTitles.has(entry.stepId) ? (
                    <li key={entry.id}>
                      <button
                        type="button"
                        onClick={() => onSelectStep(entry.stepId!)}
                        className="flex w-full items-baseline gap-3 rounded-md px-2 py-1 text-left transition hover:bg-tint/6"
                      >
                        {body}
                      </button>
                    </li>
                  ) : (
                    <li key={entry.id} className="flex items-baseline gap-3 px-2 py-1">
                      {body}
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>
          <ScrollToBottomButton
            visible={!atBottom}
            onClick={() => scrollToBottom({ smooth: true })}
            label="Newest"
          />
        </div>
      </div>
    </div>
  )
}
