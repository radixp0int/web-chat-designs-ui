import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ChevronDownIcon, ChevronUpIcon, ExpandVerticalIcon } from '../../components/icons'
import { IconButton } from '../../components/icon-button'
import { tokenClass, tokenizeLine } from '../code-editor/languages'
import type { CodeLanguage, CodeTokenKind } from '../code-editor'
import { Pill } from '../pill'
import { Switch } from '../switch'
import { alignChange, changedRanges, diffBlocks } from './diff'
import type { Range } from './diff'
import type { DiffView, DiffViewerProps } from './types'

type Segment = { text: string; kind: CodeTokenKind; changed: boolean }
type SideKind = 'equal' | 'delete' | 'insert' | 'empty'
type Side = { kind: SideKind; num: number | null; segments: Segment[] }

type Row =
  | { type: 'fold'; block: number; count: number }
  | { type: 'split'; change: number | null; left: Side; right: Side }
  | { type: 'unified'; change: number | null; a: number | null; b: number | null; side: Side }

/** Syntax tokens, cut wherever a changed range starts or ends. */
function segments(language: CodeLanguage, text: string, ranges: Range[]): Segment[] {
  const out: Segment[] = []
  let pos = 0
  for (const t of tokenizeLine(language, text)) {
    const start = pos
    const end = pos + t.text.length
    pos = end
    const cuts = [start, end]
    for (const [rs, re] of ranges) {
      if (rs > start && rs < end) cuts.push(rs)
      if (re > start && re < end) cuts.push(re)
    }
    cuts.sort((x, y) => x - y)
    for (let i = 0; i < cuts.length - 1; i++) {
      const [cs, ce] = [cuts[i], cuts[i + 1]]
      if (ce <= cs) continue
      out.push({
        text: text.slice(cs, ce),
        kind: t.kind,
        changed: ranges.some(([rs, re]) => cs >= rs && ce <= re),
      })
    }
  }
  return out
}

const EMPTY: Side = { kind: 'empty', num: null, segments: [] }

/**
 * Added lines are the accent, removed lines --danger — not the usual green.
 * brand.css has no green ramp (see Pill's tones), and a hard-coded one would
 * be the only colour in the library that ignores a `chat-theme-*` switch and
 * dark mode. Blue against red also parts more clearly than green against red
 * for the commonest colour-vision deficiencies, and the +/− column carries
 * the meaning for anyone who cannot separate them at all.
 */
const tone: Record<SideKind, { row: string; gutter: string; sign: string; mark: string }> = {
  equal: { row: '', gutter: 'text-ink-soft', sign: '', mark: '' },
  delete: {
    row: 'bg-danger/8',
    gutter: 'bg-danger/14 text-danger-fg',
    sign: 'text-danger-fg',
    mark: 'bg-danger/25',
  },
  insert: {
    row: 'bg-accent/8',
    gutter: 'bg-accent/15 text-accent-fg',
    sign: 'text-accent-fg',
    mark: 'bg-accent/25',
  },
  empty: { row: '', gutter: '', sign: '', mark: '' },
}

const HATCH = {
  backgroundImage: 'repeating-linear-gradient(-45deg, var(--line) 0 1px, transparent 1px 7px)',
}

const SIGN: Record<SideKind, string> = { equal: '', delete: '−', insert: '+', empty: '' }

function Code({ side }: { side: Side }) {
  return (
    <span className="min-w-0 grow pr-3 whitespace-pre-wrap [overflow-wrap:anywhere]">
      {side.segments.map((s, i) => (
        <span
          key={i}
          className={[tokenClass[s.kind], s.changed ? `rounded-[3px] ${tone[side.kind].mark}` : '']
            .filter(Boolean)
            .join(' ')}
        >
          {s.text}
        </span>
      ))}
    </span>
  )
}

function Gutter({
  num,
  kind,
  width = 'w-13',
}: {
  num: number | null
  kind: SideKind
  width?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={`${width} shrink-0 pr-2.5 text-right text-[12px] tabular-nums select-none ${tone[kind].gutter}`}
    >
      {num}
    </span>
  )
}

function Sign({ kind }: { kind: SideKind }) {
  // Real text rather than aria-hidden, so a screen reader hears "plus" or
  // "minus" before the line — the colour alone would say nothing.
  return (
    <span className={`w-6 shrink-0 text-center select-none ${tone[kind].sign}`}>{SIGN[kind]}</span>
  )
}

function SplitSide({ side, divider }: { side: Side; divider?: boolean }) {
  return (
    <div
      className={[
        'flex min-h-5 min-w-0',
        tone[side.kind].row,
        divider ? 'border-r border-line' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={side.kind === 'empty' ? HATCH : undefined}
    >
      <Gutter num={side.num} kind={side.kind} />
      <Sign kind={side.kind} />
      <Code side={side} />
    </div>
  )
}

/**
 * A read-only comparison of two texts, side by side or inline.
 *
 * Lines are matched with Myers' diff; a removed line and the added line that
 * replaced it are then diffed again word by word, so the exact edit inside the
 * line gets the stronger wash. Both sides are coloured with the CodeEditor's
 * tokenizer.
 *
 * Long lines wrap instead of scrolling sideways. In split view that keeps the
 * two sides of a row the same height — one grid row holds both — so they can
 * never drift out of step, which is what a pair of independently scrolling
 * panes needs a scroll-sync to prevent.
 */
export function DiffViewer({
  original,
  modified,
  language = 'text',
  title,
  originalLabel = 'Original',
  modifiedLabel = 'Modified',
  view: viewProp,
  defaultView = 'split',
  onViewChange,
  defaultHideUnchanged = true,
  context = 3,
  hideControls = false,
  className = '',
}: DiffViewerProps) {
  const [viewState, setViewState] = useState<DiffView>(defaultView)
  const view = viewProp ?? viewState
  const setView = (v: DiffView) => {
    if (viewProp === undefined) setViewState(v)
    onViewChange?.(v)
  }
  const [hide, setHide] = useState(defaultHideUnchanged)
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(() => new Set())
  const [currentRaw, setCurrent] = useState(0)

  const a = useMemo(() => original.split('\n'), [original])
  const b = useMemo(() => modified.split('\n'), [modified])
  const blocks = useMemo(() => diffBlocks(a, b), [a, b])

  const { rows, changes, added, removed } = useMemo(() => {
    const rows: Row[] = []
    let change = -1
    let added = 0
    let removed = 0

    blocks.forEach((block, bi) => {
      if (block.type === 'equal') {
        const head = bi === 0 ? 0 : context
        const tail = bi === blocks.length - 1 ? 0 : context
        const collapse = hide && !expanded.has(bi) && block.pairs.length > head + tail + 1
        block.pairs.forEach((p, k) => {
          if (collapse && k >= head && k < block.pairs.length - tail) {
            if (k === head)
              rows.push({ type: 'fold', block: bi, count: block.pairs.length - head - tail })
            return
          }
          const segs = segments(language, a[p.a], [])
          const left: Side = { kind: 'equal', num: p.a + 1, segments: segs }
          if (view === 'split') {
            rows.push({ type: 'split', change: null, left, right: { ...left, num: p.b + 1 } })
          } else {
            rows.push({ type: 'unified', change: null, a: p.a + 1, b: p.b + 1, side: left })
          }
        })
        return
      }

      change++
      removed += block.deleted.length
      added += block.inserted.length
      const aligned = alignChange(
        block.deleted.map((ln) => a[ln]),
        block.inserted.map((ln) => b[ln]),
      )
      // Word-level ranges, only for the lines alignChange paired as edits.
      const delRanges = new Map<number, Range[]>()
      const insRanges = new Map<number, Range[]>()
      for (const r of aligned) {
        if (!r.similar || r.deleted === null || r.inserted === null) continue
        const [left, right] = changedRanges(
          a[block.deleted[r.deleted]],
          b[block.inserted[r.inserted]],
        )
        delRanges.set(r.deleted, left)
        insRanges.set(r.inserted, right)
      }
      const del = (i: number): Side => ({
        kind: 'delete',
        num: block.deleted[i] + 1,
        segments: segments(language, a[block.deleted[i]], delRanges.get(i) ?? []),
      })
      const ins = (i: number): Side => ({
        kind: 'insert',
        num: block.inserted[i] + 1,
        segments: segments(language, b[block.inserted[i]], insRanges.get(i) ?? []),
      })

      if (view === 'split') {
        for (const r of aligned) {
          rows.push({
            type: 'split',
            change,
            left: r.deleted === null ? EMPTY : del(r.deleted),
            right: r.inserted === null ? EMPTY : ins(r.inserted),
          })
        }
      } else {
        block.deleted.forEach((ln, i) =>
          rows.push({ type: 'unified', change, a: ln + 1, b: null, side: del(i) }),
        )
        block.inserted.forEach((ln, i) =>
          rows.push({ type: 'unified', change, a: null, b: ln + 1, side: ins(i) }),
        )
      }
    })
    return { rows, changes: change + 1, added, removed }
  }, [blocks, a, b, language, view, hide, expanded, context])
  // Clamped, so a shorter diff arriving in new props never points past its end.
  const current = Math.min(currentRaw, Math.max(0, changes - 1))

  // The overview ruler is measured, not computed: wrapped lines make row
  // heights uneven, and only the DOM knows where each change landed.
  const scroller = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const [marks, setMarks] = useState<{ top: number; height: number; kind: SideKind | 'both' }[]>([])

  useLayoutEffect(() => {
    const sc = scroller.current
    const body = content.current
    if (!sc || !body) return
    const measure = () => {
      const total = Math.max(sc.scrollHeight, sc.clientHeight) || 1
      const next: typeof marks = []
      let k = 0
      for (const block of blocks) {
        if (block.type !== 'change') continue
        const els = sc.querySelectorAll<HTMLElement>(`[data-change="${k++}"]`)
        if (!els.length) continue
        const first = els[0]
        const last = els[els.length - 1]
        next.push({
          top: (first.offsetTop / total) * 100,
          height: ((last.offsetTop + last.offsetHeight - first.offsetTop) / total) * 100,
          kind: !block.inserted.length ? 'delete' : !block.deleted.length ? 'insert' : 'both',
        })
      }
      setMarks(next)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(sc)
    ro.observe(body)
    return () => ro.disconnect()
  }, [rows, blocks])

  // A functional update, so clicks that land before the re-render still
  // count; the scroll follows in an effect once the new index has rendered.
  const navigated = useRef(false)
  const step = (delta: number) => {
    if (!changes) return
    navigated.current = true
    setCurrent((c) => (Math.min(c, changes - 1) + delta + changes) % changes)
  }

  useEffect(() => {
    if (!navigated.current) return
    navigated.current = false
    const sc = scroller.current
    const el = sc?.querySelector<HTMLElement>(`[data-change="${current}"]`)
    if (!sc || !el) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    sc.scrollTo({ top: Math.max(0, el.offsetTop - 64), behavior: reduce ? 'auto' : 'smooth' })
  }, [current])

  const markClass = (change: number | null) =>
    change !== null && change === current ? 'shadow-[inset_3px_0_0_var(--brand-fg)]' : ''

  return (
    <div
      className={[
        'flex min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-panel-solid',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex min-h-11 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-line py-1.5 pr-1.5 pl-4">
        <div className="flex min-w-0 grow items-center gap-2">
          {title && (
            <span className="min-w-0 truncate text-[13px] font-bold text-ink-strong">{title}</span>
          )}
          <Pill tone="brand" className="font-mono tabular-nums">
            <span className="sr-only">Added </span>+{added}
          </Pill>
          <Pill tone="danger" className="font-mono tabular-nums">
            <span className="sr-only">Removed </span>−{removed}
          </Pill>
        </div>

        {!hideControls && (
          <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex items-center gap-0.5">
              <span aria-live="polite" className="mr-1.5 text-[12.5px] text-ink-soft tabular-nums">
                {changes ? `Change ${current + 1} of ${changes}` : 'No changes'}
              </span>
              <IconButton
                size="sm"
                shape="rounded"
                aria-label="Previous change"
                disabled={!changes}
                onClick={() => step(-1)}
              >
                <ChevronUpIcon width={16} height={16} />
              </IconButton>
              <IconButton
                size="sm"
                shape="rounded"
                aria-label="Next change"
                disabled={!changes}
                onClick={() => step(1)}
              >
                <ChevronDownIcon width={16} height={16} />
              </IconButton>
            </div>
            <Switch
              label="Hide unchanged"
              checked={hide}
              onChange={(on) => {
                setHide(on)
                setExpanded(new Set())
              }}
            />
            <div
              role="group"
              aria-label="Layout"
              className="flex gap-0.5 rounded-lg bg-tint/6 p-0.5"
            >
              {(['split', 'unified'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={[
                    'h-7 rounded-md px-3 text-[12.5px] font-bold capitalize transition',
                    view === v
                      ? 'bg-panel-solid text-ink-strong shadow-sm ring-1 ring-line'
                      : 'text-ink-soft hover:text-ink-strong',
                  ].join(' ')}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid h-8 shrink-0 border-b border-line bg-code-block text-[12px]">
        {view === 'split' ? (
          <div className="grid grid-cols-2 pr-3.5">
            <div className="flex items-center gap-2 border-r border-line pl-4">
              <span className="font-bold text-ink-strong">{originalLabel}</span>
              <span className="text-ink-soft">{a.length} lines</span>
            </div>
            <div className="flex items-center gap-2 pl-4">
              <span className="font-bold text-ink-strong">{modifiedLabel}</span>
              <span className="text-ink-soft">{b.length} lines</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 pl-4">
            <span className="font-bold text-danger-fg">
              − {originalLabel} · {a.length} lines
            </span>
            <span className="font-bold text-accent-fg">
              + {modifiedLabel} · {b.length} lines
            </span>
          </div>
        )}
      </div>

      <div className="flex min-h-0 grow">
        <div
          ref={scroller}
          className="relative min-w-0 grow overflow-y-auto font-mono text-[13px] leading-5 [font-variant-ligatures:none]"
        >
          <div ref={content}>
            {rows.map((row, i) => {
              if (row.type === 'fold') {
                return (
                  <button
                    key={`fold-${row.block}`}
                    type="button"
                    onClick={() => setExpanded((s) => new Set(s).add(row.block))}
                    className="flex h-7 w-full items-center gap-2 border-y border-line bg-code-block pl-5 font-sans text-[12px] font-bold text-brand-fg transition hover:bg-tint/8"
                  >
                    <ExpandVerticalIcon width={14} height={14} />
                    Show {row.count} unchanged {row.count === 1 ? 'line' : 'lines'}
                  </button>
                )
              }
              if (row.type === 'split') {
                return (
                  <div
                    key={i}
                    data-change={row.change ?? undefined}
                    className={`grid grid-cols-2 ${markClass(row.change)}`}
                  >
                    <SplitSide side={row.left} divider />
                    <SplitSide side={row.right} />
                  </div>
                )
              }
              return (
                <div
                  key={i}
                  data-change={row.change ?? undefined}
                  className={`flex min-h-5 ${tone[row.side.kind].row} ${markClass(row.change)}`}
                >
                  <Gutter num={row.a} kind={row.side.kind} width="w-12" />
                  <Gutter num={row.b} kind={row.side.kind} width="w-12" />
                  <Sign kind={row.side.kind} />
                  <Code side={row.side} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Where the changes are in the whole file, at a glance. */}
        <div
          aria-hidden="true"
          className="relative w-3.5 shrink-0 border-l border-line bg-code-block"
        >
          {marks.map((m, i) => (
            <span
              key={i}
              style={{ top: `${m.top}%`, height: `${m.height}%` }}
              className={[
                'absolute inset-x-[3px] min-h-[3px] rounded-[2px]',
                m.kind === 'delete'
                  ? 'bg-danger-fg'
                  : m.kind === 'insert'
                    ? 'bg-accent-fg'
                    : 'bg-ink-soft',
              ].join(' ')}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
