import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react'
import {
  ClockIcon,
  CollapseVerticalIcon,
  CombineIcon,
  ExpandVerticalIcon,
  PauseIcon,
  PlayIcon,
  QueueIcon,
  TrashIcon,
  XIcon,
} from '../icons'
import { IconButton } from '../icon-button'
import { useUiSize } from '../../uiSize'
import { QueueRow } from './queue-row'
import type { QueueDockHandle, QueueDockProps } from './types'

/** Rows shown before the dock stops growing and starts counting. */
const MAX_ROWS = 3

/** Remembered across sessions when a `storageKey` is given: someone who folds
 *  the queue away meant it. Storage can throw (private windows, blocked site
 *  data) — an unreadable preference is simply no preference. */
function readMinimized(storageKey: string | undefined): boolean {
  if (!storageKey) return false
  try {
    return window.localStorage.getItem(storageKey) === '1'
  } catch {
    return false
  }
}

/**
 * The send queue, parked on the composer's lip.
 *
 * It lives here rather than in the transcript for one reason: the transcript
 * moves. An answer streaming in pushes everything below it down the page, and
 * a queued message that slides away mid-sentence can't be read, let alone
 * edited. Anchored to the composer, the queue is still — and a message that
 * hasn't run yet stays editable right up to the moment it does.
 */
export function QueueDock({
  items,
  held,
  busy,
  onSendNow,
  onEdit,
  onMove,
  onRemove,
  onHold,
  onResume,
  onCombine,
  onClear,
  storageKey,
  chain,
  ref,
}: QueueDockProps & { ref?: Ref<QueueDockHandle> }) {
  const compact = useUiSize() === 'compact'
  const [minimized, setMinimized] = useState(() => readMinimized(storageKey))
  const [showAll, setShowAll] = useState(false)
  const rowRefs = useRef(new Map<number, HTMLLIElement>())
  const listId = useId()

  const registerRef = useCallback((id: number, el: HTMLLIElement | null) => {
    if (el) rowRefs.current.set(id, el)
    else rowRefs.current.delete(id)
  }, [])

  useImperativeHandle(ref, () => ({
    focusLast: () => {
      const last = items[items.length - 1]
      if (last) rowRefs.current.get(last.id)?.focus()
    },
  }))

  useEffect(() => {
    if (!storageKey) return
    try {
      window.localStorage.setItem(storageKey, minimized ? '1' : '0')
    } catch {
      // A preference that can't be stored still works for this session.
    }
  }, [minimized, storageKey])

  // Removing the row you were standing on drops focus to the document body,
  // which sends the next Tab back to the top of the page. Catch it and hand
  // focus to whichever row took its place.
  useEffect(() => {
    const live = new Set(items.map((q) => q.id))
    for (const id of rowRefs.current.keys()) if (!live.has(id)) rowRefs.current.delete(id)
    if (document.activeElement !== document.body) return
    const first = items[0]
    if (first) rowRefs.current.get(first.id)?.focus()
  }, [items])

  const focusSibling = useCallback(
    (from: number, delta: -1 | 1) => {
      const target = items[from + delta]
      if (target) rowRefs.current.get(target.id)?.focus()
    },
    [items],
  )

  const planning = chain?.state?.phase === 'planning'
  const running = chain?.state?.phase === 'running' ? chain.state : null
  // A chain keeps its dock to the end: while building it is where steps go,
  // and on the last step it still says how far along the chain is.
  if (items.length === 0 && !planning && !running) return null

  // Folded, only the message that runs next is shown. Three rows is where a
  // dock stops being a glance and starts being a list, so the rest wait behind
  // a count until the reader asks for them.
  //
  // Deliberately a cap rather than a scrollbar: a scrolling list would have to
  // clip its own overflow, and a row's menu opens out of the dock's box.
  const cap = minimized ? 1 : showAll ? items.length : MAX_ROWS
  const shown = items.slice(0, cap)
  const hidden = items.length - shown.length
  const label = compact ? 'Queued' : 'Up next'
  // Building a chain is a hold, but not one the reader has to be warned
  // about: it looks like a draft, not like something stuck.
  const caution = held && !planning
  const step = running ? Math.min(running.total, Math.max(1, running.total - items.length)) : 0

  return (
    <div
      className={`mb-1.5 rounded-lg border bg-panel-solid transition-colors ${
        caution ? 'border-caution-line bg-caution-surface' : 'border-line'
      }`}
    >
      <div
        className={`flex items-center gap-1.5 rounded-t-lg border-b px-2 py-1 ${
          caution ? 'border-caution-line' : 'border-line bg-tint/4'
        }`}
      >
        {/* One live region for the whole state of the queue: how many are
            waiting, and whether anything is going to send. Queueing a message
            or holding the queue is otherwise silent to a screen reader. */}
        <span role="status" className="flex min-w-0 items-center gap-1.5">
          {planning ? (
            <>
              <span className="text-brand-fg" aria-hidden>
                <QueueIcon width={13} height={13} />
              </span>
              <span className="text-[11.5px] font-bold text-ink-strong">
                {compact ? 'Chain' : 'New chain'}
              </span>
              <span className="rounded-full bg-chip px-1.5 text-[10.5px] font-bold text-chip-fg">
                {items.length}
              </span>
              <span className={`truncate text-[11px] text-ink-soft ${compact ? 'sr-only' : ''}`}>
                Nothing runs until you start it
              </span>
            </>
          ) : (
            <>
              <span className={caution ? 'text-caution' : 'text-brand-fg'} aria-hidden>
                {caution ? (
                  <PauseIcon width={13} height={13} />
                ) : (
                  <ClockIcon width={13} height={13} />
                )}
              </span>
              <span className="text-[11.5px] font-bold text-ink-strong">
                {caution ? 'Held' : running ? (compact ? 'Chain' : 'Running chain') : label}
              </span>
              {running ? (
                <>
                  <span className="text-[11px] font-bold text-ink-soft tabular-nums">
                    {step} of {running.total}
                  </span>
                  {!compact && (
                    <span
                      className="h-1 w-14 overflow-hidden rounded-full bg-chip"
                      role="progressbar"
                      aria-label="Chain progress"
                      aria-valuemin={0}
                      aria-valuemax={running.total}
                      aria-valuenow={step}
                    >
                      <span
                        className="block h-full rounded-full bg-accent transition-[width] duration-500"
                        style={{ width: `${(step / running.total) * 100}%` }}
                      />
                    </span>
                  )}
                </>
              ) : (
                <span
                  className={`rounded-full px-1.5 text-[10.5px] font-bold ${
                    caution ? 'bg-caution/15 text-caution' : 'bg-chip text-chip-fg'
                  }`}
                >
                  {items.length}
                </span>
              )}
              {caution && (
                <span className={`truncate text-[11px] text-ink-soft ${compact ? 'sr-only' : ''}`}>
                  Nothing sends until you resume
                </span>
              )}
            </>
          )}
        </span>

        <span className="flex-1" />

        {planning ? null : held ? (
          <HeaderButton
            icon={<PlayIcon width={12} height={12} />}
            label="Resume"
            onClick={onResume}
            accent
            iconOnly={compact}
          />
        ) : (
          <HeaderButton
            icon={<PauseIcon width={12} height={12} />}
            label="Hold"
            title="Hold the queue — nothing sends until you resume"
            onClick={onHold}
            iconOnly={compact}
          />
        )}

        {items.length > 1 && !compact && !planning && (
          <HeaderButton
            icon={<CombineIcon width={12} height={12} />}
            label="Combine"
            title="Fold every queued message into one turn"
            onClick={onCombine}
          />
        )}

        {items.length > 0 && (
          <HeaderButton
            icon={<TrashIcon width={12} height={12} />}
            label="Clear"
            title="Remove every queued message"
            onClick={onClear}
            iconOnly={compact}
          />
        )}

        {/* Beside Clear, and the last control in the row: the one that changes
            how much room the dock takes rather than what is in it. */}
        <IconButton
          size="sm"
          shape="rounded"
          onClick={() => setMinimized((m) => !m)}
          aria-expanded={!minimized}
          aria-controls={listId}
          aria-label={minimized ? 'Expand the queue' : 'Minimize the next message'}
          title={minimized ? 'Expand' : 'Minimize'}
        >
          {minimized ? (
            <ExpandVerticalIcon width={13} height={13} />
          ) : (
            <CollapseVerticalIcon width={13} height={13} />
          )}
        </IconButton>

        {planning && chain && (
          <>
            <IconButton
              size="sm"
              shape="rounded"
              onClick={chain.cancel}
              aria-label="Cancel this chain — steps you added stay queued and held"
              title="Cancel chain — steps you added stay queued and held"
            >
              <XIcon width={13} height={13} />
            </IconButton>
            <button
              type="button"
              onClick={chain.run}
              disabled={items.length === 0}
              aria-label={compact ? 'Run the chain' : undefined}
              title="Run every step in order"
              className={`ml-0.5 flex items-center gap-1 rounded-md bg-brand-solid font-bold text-on-brand-solid transition hover:brightness-110 disabled:bg-tint/15 disabled:text-ink-soft ${
                compact ? 'p-1.5' : 'px-2 py-1 text-[11.5px]'
              }`}
            >
              <PlayIcon width={12} height={12} />
              {!compact && 'Run chain'}
            </button>
          </>
        )}
      </div>

      {planning && items.length === 0 && (
        <p className="px-3 py-2.5 text-[12px] text-ink-soft">
          Type a question below and press Enter to add it as the first step. Steps run in order, in
          this chat.
        </p>
      )}

      <ul
        id={listId}
        aria-label="Queued messages"
        className={`flex-col gap-px px-1.5 py-1 ${shown.length ? 'flex' : 'hidden'}`}
      >
        {shown.map((item, i) => (
          <QueueRow
            key={item.id}
            item={item}
            index={i}
            total={items.length}
            next={i === 0}
            held={caution}
            busy={busy}
            planning={planning}
            compact={compact}
            minimized={minimized}
            onSendNow={onSendNow}
            onEdit={onEdit}
            onMove={onMove}
            onRemove={onRemove}
            onFocusSibling={focusSibling}
            registerRef={registerRef}
          />
        ))}
      </ul>

      {hidden > 0 && (
        <button
          type="button"
          onClick={() => {
            if (minimized) setMinimized(false)
            else setShowAll(true)
          }}
          className="w-full px-3 pb-1.5 text-left text-[11px] font-semibold text-ink-soft transition hover:text-ink-strong"
        >
          {hidden} more queued
        </button>
      )}
    </div>
  )
}

/** Header actions: a label at full width, the glyph alone when compact. */
function HeaderButton({
  icon,
  label,
  title,
  onClick,
  accent = false,
  iconOnly = false,
}: {
  icon: ReactNode
  label: string
  title?: string
  onClick: () => void
  accent?: boolean
  iconOnly?: boolean
}) {
  if (iconOnly) {
    return (
      <IconButton
        size="sm"
        shape="rounded"
        onClick={onClick}
        aria-label={label}
        title={title ?? label}
        className={accent ? 'text-accent-fg' : ''}
      >
        {icon}
      </IconButton>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={title ?? label}
      className={`flex items-center gap-1 rounded-md px-1.5 py-1 text-[11.5px] font-semibold transition hover:bg-tint/8 ${
        accent ? 'text-accent-fg' : 'text-ink-soft hover:text-ink-strong'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}
