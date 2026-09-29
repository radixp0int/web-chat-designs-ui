import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExpandVerticalIcon,
  FormatIcon,
  SearchIcon,
} from '../../components/icons'
import { CopyButton } from '../../components/copy-button'
import { IconButton } from '../../components/icon-button'
import { AdaptiveButton } from '../button'
import { EditorOptionsMenu } from '../editor-options'
import { FindReplaceBar } from '../find-replace'
import { findTextMatches, replaceAllText } from '../find-replace-model'
import { formatCode, lintCode, tokenizeLine } from '../code-editor/languages'
import type { CodeLanguage } from '../code-editor'
import { Pill } from '../pill'
import { alignChange, changedRanges, diffBlocks } from './diff'
import type { Range } from './diff'
import { EditPane } from './edit-pane'
import type { PaneRow } from './edit-pane'
import { Gutter, Sign, Tokens } from './parts'
import { HATCH, tone } from './tone'
import type { Segment, Side, SideKind } from './tone'
import type { DiffView, DiffViewerProps } from './types'

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

function Code({
  side,
  wordWrap,
  search,
}: {
  side: Side
  wordWrap: boolean
  search?: { query: string; activeStart?: number }
}) {
  return (
    <span
      className={`min-w-0 grow pr-3 ${wordWrap ? 'whitespace-pre-wrap [overflow-wrap:anywhere]' : 'whitespace-pre'}`}
    >
      <Tokens side={side} search={search} />
    </span>
  )
}

function SplitSide({
  side,
  divider,
  wordWrap,
  lineNumbers,
  search,
}: {
  side: Side
  divider?: boolean
  wordWrap: boolean
  lineNumbers: boolean
  search?: { query: string; activeStart?: number }
}) {
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
      {lineNumbers && <Gutter num={side.num} kind={side.kind} />}
      <Sign kind={side.kind} />
      <Code side={side} wordWrap={wordWrap} search={search} />
    </div>
  )
}

/**
 * A comparison of two texts, side by side or inline — read-only by default,
 * with either side, or both, editable through `editable`.
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
 *
 * Editing changes that. A side you can type in is an EditPane — CodeEditor's
 * transparent textarea over the coloured rows — and a textarea line is
 * exactly one row tall, so in edit mode lines do not wrap, each pane scrolls
 * sideways on its own and the two are scroll-synced vertically. Folding is
 * off too: a folded line has nowhere to be in the textarea. The diff is
 * recomputed on every keystroke from the `original` and `modified` props, so
 * the component stays controlled — each side's edits come back through
 * `onOriginalChange` and `onModifiedChange`.
 */
export function DiffViewer({
  original,
  modified,
  language: languageProp,
  defaultLanguage = 'text',
  disabled = false,
  title,
  originalLabel = 'Original',
  modifiedLabel = 'Modified',
  view: viewProp,
  defaultView = 'split',
  onViewChange,
  defaultHideUnchanged = true,
  options,
  context = 3,
  hideControls = false,
  editable = 'none',
  onOriginalChange,
  onModifiedChange,
  onCopyOriginal,
  onCopyModified,
  tabSize = 2,
  className = '',
}: DiffViewerProps) {
  const [initialLanguage] = useState(defaultLanguage)
  const language = languageProp ?? initialLanguage
  const [wordWrap, setWordWrap] = useState(options?.wordWrap !== 'off')
  const [showLineNumbers, setShowLineNumbers] = useState(options?.lineNumbers !== 'off')
  const [showStatusBar, setShowStatusBar] = useState(
    options?.statusBar !== false && options?.statusBar !== 'off',
  )
  const findInputRef = useRef<HTMLInputElement>(null)
  const replacementInputRef = useRef<HTMLInputElement>(null)
  const findReturnRef = useRef<HTMLElement | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const [findOpen, setFindOpen] = useState(false)
  const [replaceOpen, setReplaceOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [replacement, setReplacement] = useState('')
  const [currentMatch, setCurrentMatch] = useState(0)
  useEffect(() => {
    if (options?.wordWrap !== undefined) setWordWrap(options.wordWrap === 'on')
  }, [options?.wordWrap])
  useEffect(() => {
    if (options?.lineNumbers !== undefined) setShowLineNumbers(options.lineNumbers === 'on')
  }, [options?.lineNumbers])
  useEffect(() => {
    if (options?.statusBar !== undefined) {
      setShowStatusBar(options.statusBar === true || options.statusBar === 'on')
    }
  }, [options?.statusBar])
  const [viewState, setViewState] = useState<DiffView>(defaultView)
  const view = viewProp ?? viewState
  const setView = (v: DiffView) => {
    if (viewProp === undefined) setViewState(v)
    onViewChange?.(v)
  }
  // A side takes typing only with its handler too, as CodeEditor's onChange.
  const canEditOriginal = (editable === 'original' || editable === 'both') && !!onOriginalChange
  const canEditModified = (editable === 'modified' || editable === 'both') && !!onModifiedChange
  const editing = canEditOriginal || canEditModified
  const formatEligible = language === 'json' || language === 'csv' || language === 'html'
  const formattedOriginal = useMemo(
    () => (formatEligible ? formatCode(language, original, tabSize) : original),
    [formatEligible, language, original, tabSize],
  )
  const formattedModified = useMemo(
    () => (formatEligible ? formatCode(language, modified, tabSize) : modified),
    [formatEligible, language, modified, tabSize],
  )
  const originalCanFormat = formattedOriginal !== original
  const modifiedCanFormat = formattedModified !== modified
  const bothSidesValid =
    formatEligible && lintCode(language, original) === null && lintCode(language, modified) === null
  const [formattedView, setFormattedView] = useState(false)
  const showingFormattedView = bothSidesValid && !editing && formattedView
  const visibleOriginal = showingFormattedView ? formattedOriginal : original
  const visibleModified = showingFormattedView ? formattedModified : modified
  const originalSearchMatches = useMemo(
    () => findTextMatches(visibleOriginal, query),
    [visibleOriginal, query],
  )
  const modifiedSearchMatches = useMemo(
    () => findTextMatches(visibleModified, query),
    [visibleModified, query],
  )
  const searchMatches = useMemo(
    () => [
      ...originalSearchMatches.map((match) => ({
        ...match,
        side: 'original' as const,
      })),
      ...modifiedSearchMatches.map((match) => ({
        ...match,
        side: 'modified' as const,
      })),
    ],
    [originalSearchMatches, modifiedSearchMatches],
  )
  const activeSearch = searchMatches[Math.min(currentMatch, Math.max(0, searchMatches.length - 1))]

  useEffect(() => {
    setCurrentMatch((current) => Math.min(current, Math.max(0, searchMatches.length - 1)))
  }, [searchMatches.length])
  useEffect(() => {
    if (findOpen) (replaceOpen ? replacementInputRef : findInputRef).current?.focus()
  }, [findOpen, replaceOpen])

  const formatEditable = () => {
    if (canEditOriginal && originalCanFormat) onOriginalChange?.(formattedOriginal)
    if (canEditModified && modifiedCanFormat) onModifiedChange?.(formattedModified)
  }
  useEffect(() => setFormattedView(false), [editing, language])
  // Unified view has room for one textarea: the modified side's, unless only
  // the original is editable.
  const unifiedEdits = canEditModified ? 'modified' : 'original'

  const [hide, setHide] = useState(defaultHideUnchanged)
  const folding = hide && !editing && !query
  const [expanded, setExpanded] = useState<ReadonlySet<number>>(() => new Set())
  const [currentRaw, setCurrent] = useState(0)

  const a = useMemo(() => visibleOriginal.split('\n'), [visibleOriginal])
  const b = useMemo(() => visibleModified.split('\n'), [visibleModified])
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
        const collapse = folding && !expanded.has(bi) && block.pairs.length > head + tail + 1
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
  }, [blocks, a, b, language, view, folding, expanded, context])
  // Clamped, so a shorter diff arriving in new props never points past its end.
  const current = Math.min(currentRaw, Math.max(0, changes - 1))
  const stepFind = (delta: number) => {
    if (!searchMatches.length) return
    setCurrentMatch(
      (current) =>
        (Math.min(current, searchMatches.length - 1) + delta + searchMatches.length) %
        searchMatches.length,
    )
  }
  const canReplaceSearch =
    !!activeSearch && (activeSearch.side === 'original' ? canEditOriginal : canEditModified)
  const canReplaceAny =
    (canEditOriginal && !!originalSearchMatches.length) ||
    (canEditModified && !!modifiedSearchMatches.length)
  const replaceCurrent = () => {
    if (!activeSearch || !canReplaceSearch) return
    const source = activeSearch.side === 'original' ? original : modified
    const next = source.slice(0, activeSearch.start) + replacement + source.slice(activeSearch.end)
    if (activeSearch.side === 'original') onOriginalChange?.(next)
    else onModifiedChange?.(next)
    if (replacement.toLocaleLowerCase() === query.toLocaleLowerCase()) stepFind(1)
  }
  const replaceAll = () => {
    if (canEditOriginal && originalSearchMatches.length) {
      onOriginalChange?.(replaceAllText(original, originalSearchMatches, replacement))
    }
    if (canEditModified && modifiedSearchMatches.length) {
      onModifiedChange?.(replaceAllText(modified, modifiedSearchMatches, replacement))
    }
  }
  const openFind = (replace = false) => {
    if (disabled || hideControls) return
    if (!findOpen) findReturnRef.current = document.activeElement as HTMLElement | null
    setFindOpen(true)
    if (replace && editing) setReplaceOpen(true)
  }
  const closeFind = () => {
    setFindOpen(false)
    requestAnimationFrame(() => findReturnRef.current?.focus())
  }

  // Edit mode draws the same rows as columns, one per pane. No folds reach
  // here — folding is off while editing.
  const panes = useMemo(() => {
    if (!editing) return null
    const left: PaneRow[] = []
    const right: PaneRow[] = []
    for (const row of rows) {
      if (row.type === 'split') {
        for (const [into, side] of [
          [left, row.left],
          [right, row.right],
        ] as const) {
          into.push({
            kind: side.kind,
            nums: [side.num],
            segments: side.segments,
            line: side.num === null ? null : side.num - 1,
            change: row.change,
          })
        }
      } else if (row.type === 'unified') {
        const num = unifiedEdits === 'modified' ? row.b : row.a
        right.push({
          kind: row.side.kind,
          nums: [row.a, row.b],
          segments: row.side.segments,
          line: num === null ? null : num - 1,
          change: row.change,
        })
      }
    }
    return { left, right }
  }, [editing, rows, unifiedEdits])

  // The overview ruler is measured, not computed: wrapped lines make row
  // heights uneven, and only the DOM knows where each change landed.
  const scroller = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  // Split edit mode's left pane; `scroller` is the right one.
  const leftPane = useRef<HTMLDivElement>(null)
  const follow = (from: typeof scroller, to: typeof scroller) => () => {
    if (from.current && to.current && to.current.scrollTop !== from.current.scrollTop) {
      to.current.scrollTop = from.current.scrollTop
    }
  }
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
  }, [rows, blocks, editing, view])

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

  useEffect(() => {
    if (!activeSearch) return
    rootRef.current
      ?.querySelector<HTMLElement>('[data-current-search="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [activeSearch, rows])

  const markClass = (change: number | null) =>
    change !== null && change === current ? 'shadow-[inset_3px_0_0_var(--brand-fg)]' : ''

  const searchFor = (side: 'original' | 'modified', line: number | null) => ({
    query,
    activeStart:
      activeSearch?.side === side && activeSearch.line === line ? activeSearch.column : undefined,
  })
  const onShortcut = (event: KeyboardEvent<HTMLDivElement>) => {
    const mod = event.metaKey || event.ctrlKey
    const key = event.key.toLowerCase()
    if (mod && !event.altKey && (key === 'f' || key === 'h')) {
      event.preventDefault()
      openFind(key === 'h')
    } else if (event.key === 'Escape' && findOpen) {
      event.preventDefault()
      event.stopPropagation()
      closeFind()
    }
  }

  return (
    <div
      ref={rootRef}
      aria-disabled={disabled || undefined}
      onKeyDownCapture={onShortcut}
      className={[
        'flex min-h-0 flex-col overflow-hidden rounded-surface border border-line bg-panel-solid transition',
        'has-[textarea:focus-visible]:border-accent has-[textarea:focus-visible]:ring-3 has-[textarea:focus-visible]:ring-accent/20',
        disabled ? 'opacity-40' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="@container flex min-h-11 shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-line py-1.5 pr-1.5 pl-4">
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
                disabled={disabled || !changes}
                onClick={() => step(-1)}
              >
                <ChevronUpIcon width={16} height={16} />
              </IconButton>
              <IconButton
                size="sm"
                shape="rounded"
                aria-label="Next change"
                disabled={disabled || !changes}
                onClick={() => step(1)}
              >
                <ChevronDownIcon width={16} height={16} />
              </IconButton>
            </div>
            {formatEligible &&
              (editing ? (
                <AdaptiveButton
                  variant="ghost"
                  size="sm"
                  collapseAt="sm"
                  icon={<FormatIcon width={16} height={16} />}
                  label="Format editable"
                  tooltip="Format editable content"
                  disabled={
                    disabled ||
                    ((!canEditOriginal || !originalCanFormat) &&
                      (!canEditModified || !modifiedCanFormat))
                  }
                  onClick={formatEditable}
                  className="text-brand-fg"
                />
              ) : (
                <AdaptiveButton
                  variant="ghost"
                  size="sm"
                  collapseAt="sm"
                  icon={<FormatIcon width={16} height={16} />}
                  label={showingFormattedView ? 'Raw view' : 'Format view'}
                  tooltip={showingFormattedView ? 'Show raw comparison' : 'Format comparison view'}
                  aria-pressed={showingFormattedView}
                  disabled={
                    disabled ||
                    (!showingFormattedView &&
                      (!bothSidesValid || (!originalCanFormat && !modifiedCanFormat)))
                  }
                  onClick={() => setFormattedView((on) => !on)}
                  className="text-brand-fg"
                />
              ))}
            <div
              role="group"
              aria-label="Layout"
              className="flex gap-0.5 rounded-control bg-tint/6 p-0.5"
            >
              {(['split', 'unified'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  disabled={disabled}
                  onClick={() => setView(v)}
                  className={[
                    'h-7 rounded-control px-3 text-[12.5px] font-bold capitalize transition',
                    view === v
                      ? 'bg-panel-solid text-ink-strong shadow-sm ring-1 ring-line'
                      : 'text-ink-soft hover:text-ink-strong',
                  ].join(' ')}
                >
                  {v}
                </button>
              ))}
            </div>
            <IconButton
              size="sm"
              shape="rounded"
              aria-label="Find in diff"
              title="Find"
              disabled={disabled}
              onClick={() => openFind()}
            >
              <SearchIcon width={15} height={15} />
            </IconButton>
            <EditorOptionsMenu
              disabled={disabled}
              options={[
                {
                  label: 'Word wrap',
                  checked: wordWrap && !editing,
                  disabled: editing,
                  onChange: setWordWrap,
                },
                {
                  label: 'Line numbers',
                  checked: showLineNumbers,
                  onChange: setShowLineNumbers,
                },
                { label: 'Status bar', checked: showStatusBar, onChange: setShowStatusBar },
                {
                  label: 'Hide unchanged',
                  checked: hide,
                  disabled: editing,
                  onChange: (on) => {
                    setHide(on)
                    setExpanded(new Set())
                  },
                },
              ]}
            />
          </div>
        )}
      </div>

      {findOpen && (
        <FindReplaceBar
          query={query}
          replacement={replacement}
          replaceOpen={replaceOpen}
          replaceAvailable={editing}
          current={Math.min(currentMatch, Math.max(0, searchMatches.length - 1))}
          total={searchMatches.length}
          canReplaceCurrent={canReplaceSearch}
          canReplaceAll={canReplaceAny}
          inputRef={findInputRef}
          replacementInputRef={replacementInputRef}
          onQueryChange={(next) => {
            setQuery(next)
            setCurrentMatch(0)
          }}
          onReplacementChange={setReplacement}
          onToggleReplace={() => setReplaceOpen((open) => !open)}
          onPrevious={() => stepFind(-1)}
          onNext={() => stepFind(1)}
          onReplace={replaceCurrent}
          onReplaceAll={replaceAll}
          onClose={closeFind}
        />
      )}

      {showStatusBar && (
        <div className="grid min-h-8 shrink-0 border-b border-line bg-code-block text-[12px]">
          {view === 'split' ? (
            <div className="grid grid-cols-2 pr-3.5">
              <div className="flex min-w-0 items-center gap-2 border-r border-line pl-4">
                <span className="font-bold text-ink-strong">{originalLabel}</span>
                <span className="text-ink-soft">{a.length} lines</span>
                <span className="ml-auto flex shrink-0 items-center gap-1 pr-1">
                  {editing && <Access editable={canEditOriginal} />}
                  {onCopyOriginal && (
                    <CopySide
                      text={original}
                      label={originalLabel}
                      onCopy={onCopyOriginal}
                      disabled={disabled}
                    />
                  )}
                </span>
              </div>
              <div className="flex min-w-0 items-center gap-2 pl-4">
                <span className="font-bold text-ink-strong">{modifiedLabel}</span>
                <span className="text-ink-soft">{b.length} lines</span>
                <span className="ml-auto flex shrink-0 items-center gap-1 pr-1">
                  {editing && <Access editable={canEditModified} />}
                  {onCopyModified && (
                    <CopySide
                      text={modified}
                      label={modifiedLabel}
                      onCopy={onCopyModified}
                      disabled={disabled}
                    />
                  )}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-4 pl-4">
              <span className="flex items-center gap-1 font-bold text-danger-fg">
                − {originalLabel} · {a.length} lines
                {onCopyOriginal && (
                  <CopySide
                    text={original}
                    label={originalLabel}
                    onCopy={onCopyOriginal}
                    disabled={disabled}
                  />
                )}
              </span>
              <span className="flex items-center gap-1 font-bold text-accent-fg">
                + {modifiedLabel} · {b.length} lines
                {onCopyModified && (
                  <CopySide
                    text={modified}
                    label={modifiedLabel}
                    onCopy={onCopyModified}
                    disabled={disabled}
                  />
                )}
              </span>
              {editing && (
                <span className="ml-auto pr-5 text-ink-soft">
                  Editing {unifiedEdits === 'modified' ? modifiedLabel : originalLabel}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex min-h-0 grow">
        {panes ? (
          <div className="flex min-w-0 grow">
            {view === 'split' && (
              <EditPane
                rows={panes.left}
                lines={a}
                editable={canEditOriginal}
                disabled={disabled}
                onChange={onOriginalChange}
                language={language}
                tabSize={tabSize}
                label={originalLabel}
                current={current}
                lineNumbers={showLineNumbers}
                search={{
                  query,
                  side: 'original',
                  active: activeSearch,
                }}
                scrollRef={leftPane}
                onScroll={follow(leftPane, scroller)}
                className="border-r border-line"
              />
            )}
            <EditPane
              rows={panes.right}
              lines={view === 'split' || unifiedEdits === 'modified' ? b : a}
              editable={view === 'split' ? canEditModified : true}
              disabled={disabled}
              onChange={
                view === 'split' || unifiedEdits === 'modified'
                  ? onModifiedChange
                  : onOriginalChange
              }
              language={language}
              tabSize={tabSize}
              label={
                view === 'split' || unifiedEdits === 'modified' ? modifiedLabel : originalLabel
              }
              current={current}
              lineNumbers={showLineNumbers}
              search={{
                query,
                side: view === 'split' ? 'modified' : 'unified',
                active: activeSearch,
              }}
              scrollRef={scroller}
              contentRef={content}
              onScroll={follow(scroller, leftPane)}
            />
          </div>
        ) : (
          <div
            ref={scroller}
            className={`relative min-w-0 grow font-mono text-[13px] leading-5 [font-variant-ligatures:none] ${wordWrap ? 'overflow-y-auto' : 'overflow-auto'}`}
          >
            <div ref={content}>
              {rows.map((row, i) => {
                if (row.type === 'fold') {
                  return (
                    <button
                      key={`fold-${row.block}`}
                      type="button"
                      disabled={disabled}
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
                      <SplitSide
                        side={row.left}
                        divider
                        wordWrap={wordWrap}
                        lineNumbers={showLineNumbers}
                        search={searchFor('original', row.left.num)}
                      />
                      <SplitSide
                        side={row.right}
                        wordWrap={wordWrap}
                        lineNumbers={showLineNumbers}
                        search={searchFor('modified', row.right.num)}
                      />
                    </div>
                  )
                }
                return (
                  <div
                    key={i}
                    data-change={row.change ?? undefined}
                    className={`flex min-h-5 ${tone[row.side.kind].row} ${markClass(row.change)}`}
                  >
                    {showLineNumbers && (
                      <>
                        <Gutter num={row.a} kind={row.side.kind} width="w-12" />
                        <Gutter num={row.b} kind={row.side.kind} width="w-12" />
                      </>
                    )}
                    <Sign kind={row.side.kind} />
                    <Code
                      side={row.side}
                      wordWrap={wordWrap}
                      search={{
                        query,
                        activeStart:
                          activeSearch &&
                          ((activeSearch.side === 'original' && activeSearch.line === row.a) ||
                            (activeSearch.side === 'modified' && activeSearch.line === row.b))
                            ? activeSearch.column
                            : undefined,
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}

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

/** Which side takes typing, on the label bar — the panes look alike otherwise. */
function Access({ editable }: { editable: boolean }) {
  return (
    <span className="pr-3 text-[11px] font-bold tracking-[0.06em] text-ink-soft uppercase">
      {editable ? 'Editable' : 'Read only'}
    </span>
  )
}

/** Copies one side as it is now — with edits, since `text` is the live prop. */
function CopySide({
  text,
  label,
  onCopy,
  disabled,
}: {
  text: string
  label: string
  onCopy: (value: string) => void
  disabled?: boolean
}) {
  return (
    <CopyButton
      text={text}
      label={`Copy ${label}`}
      copiedLabel={`Copied ${label}`}
      size="sm"
      iconSize={14}
      disabled={disabled}
      onCopied={onCopy}
    />
  )
}
