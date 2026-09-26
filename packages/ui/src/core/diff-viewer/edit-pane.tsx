import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, KeyboardEvent, Ref, SyntheticEvent } from 'react'
import type { CodeLanguage } from '../code-editor'
import { languageLabels } from '../code-editor/languages'
import {
  caretToIndex,
  indexToCaret,
  paneText,
  readEdit,
  rowOf,
  snapOffset,
  toCaret,
  toOffset,
} from './edit-model'
import { Gutter, Sign, Tokens } from './parts'
import { HATCH, tone } from './tone'
import type { Segment, SideKind } from './tone'

/** One row of a pane: what it draws, and which of the side's lines it is (`null` for a gap). */
export type PaneRow = {
  kind: SideKind
  /** One line number per gutter column — one in split view, two in unified. */
  nums: (number | null)[]
  segments: Segment[]
  line: number | null
  change: number | null
}

/**
 * Shared by the textarea and the highlight layer, for the reason CodeEditor
 * gives: any difference slides the caret off the glyphs. No wrapping — a
 * textarea line is one row tall, and every row has to be.
 */
const metrics =
  'font-mono text-[13px] leading-5 whitespace-pre [font-variant-ligatures:none] py-0 pr-8 pl-1'

/** Real-text offsets: where the selection started, and where it is now. */
type Sel = { anchor: number; head: number }
type Snapshot = { text: string; sel: Sel }
type EditKind = 'type' | 'delete' | 'other'

/**
 * One side of the diff as a code editor, rows level with the other side.
 *
 * The textarea holds the rows, not the side's text: an empty line stands in
 * for every gap, so the caret row and the drawn row always agree. The caret
 * is kept off those stand-ins — it steps over a gap — and Backspace or Delete
 * next to one joins the real lines either side of it.
 *
 * Undo is this component's own. The rows are rebuilt from the new diff after
 * nearly every edit that adds or removes a line, and the browser forgets its
 * undo history whenever a textarea's value is set from script.
 */
export function EditPane({
  rows,
  lines,
  editable,
  onChange,
  language,
  tabSize,
  label,
  current,
  scrollRef,
  contentRef,
  onScroll,
  className = '',
}: {
  rows: PaneRow[]
  lines: string[]
  editable: boolean
  onChange?: (value: string) => void
  language: CodeLanguage
  tabSize: number
  label: string
  current: number
  scrollRef?: Ref<HTMLDivElement>
  contentRef?: Ref<HTMLDivElement>
  onScroll?: () => void
  className?: string
}) {
  const helpId = useId()
  const map = useMemo(() => rows.map((r) => r.line), [rows])
  const text = useMemo(() => lines.join('\n'), [lines])
  const value = useMemo(() => paneText(map, lines), [map, lines])

  const ta = useRef<HTMLTextAreaElement>(null)
  const [released, setReleased] = useState(false)
  const [, rerender] = useState(0)
  // The last selection, in textarea offsets (to tell which way the caret
  // moved) and in real-text offsets (for undo snapshots).
  const lastSel = useRef({ head: 0, column: 0 })
  const sel = useRef<Sel>({ anchor: 0, head: 0 })
  const pending = useRef<(Sel & { text: string }) | null>(null)
  const history = useRef({
    past: [] as Snapshot[],
    future: [] as Snapshot[],
    kind: 'other' as EditKind,
    at: 0,
  })

  const toReal = (offset: number) => caretToIndex(text, toCaret(map, value, offset))
  // Read straight from the textarea just before an edit, for the undo
  // snapshot: onSelect misses a selection that script set.
  const remember = (el: HTMLTextAreaElement) => {
    const forward = el.selectionDirection !== 'backward'
    const anchor = forward ? el.selectionStart : el.selectionEnd
    const head = forward ? el.selectionEnd : el.selectionStart
    sel.current = { anchor: toReal(anchor), head: toReal(head) }
  }

  // Puts the selection back once the new rows are in — setting the value
  // from script moves the caret to the end.
  useLayoutEffect(() => {
    const p = pending.current
    const el = ta.current
    pending.current = null
    if (!p || !el || p.text !== text) return
    const a = toOffset(map, value, indexToCaret(text, p.anchor))
    const h = toOffset(map, value, indexToCaret(text, p.head))
    el.setSelectionRange(Math.min(a, h), Math.max(a, h), h < a ? 'backward' : 'forward')
    sel.current = { anchor: p.anchor, head: p.head }
    lastSel.current = { head: h, column: h - rowOf(value, h).start }
  })

  const commit = (next: string, anchor: number, head: number, kind: EditKind) => {
    const h = history.current
    const now = Date.now()
    const merge = kind !== 'other' && kind === h.kind && now - h.at < 1000
    if (next !== text && !merge) h.past.push({ text, sel: sel.current })
    if (next !== text) h.future = []
    h.kind = kind
    h.at = now
    pending.current = { text: next, anchor, head }
    if (next === text) rerender((n) => n + 1)
    else onChange?.(next)
  }

  const restore = (from: Snapshot[], to: Snapshot[]) => {
    const snap = from.pop()
    if (!snap) return
    to.push({ text, sel: sel.current })
    history.current.kind = 'other'
    pending.current = { text: snap.text, ...snap.sel }
    if (snap.text === text) rerender((n) => n + 1)
    else onChange?.(snap.text)
  }
  const undo = () => restore(history.current.past, history.current.future)
  const redo = () => restore(history.current.future, history.current.past)

  // Edit ▸ Undo in the browser's menu arrives as a beforeinput, not a key.
  // Every other beforeinput is an edit about to land.
  const latest = useRef({ undo, redo, remember })
  latest.current = { undo, redo, remember }
  useEffect(() => {
    const el = ta.current
    if (!el) return
    const onBeforeInput = (e: InputEvent) => {
      if (e.inputType !== 'historyUndo' && e.inputType !== 'historyRedo') {
        latest.current.remember(el)
        return
      }
      e.preventDefault()
      if (e.inputType === 'historyUndo') latest.current.undo()
      else latest.current.redo()
    }
    el.addEventListener('beforeinput', onBeforeInput)
    return () => el.removeEventListener('beforeinput', onBeforeInput)
  }, [editable])

  const onInput = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    const edit = readEdit(map, value, el.value, el.selectionEnd)
    const at = caretToIndex(edit.text, edit.caret)
    const type = (e.nativeEvent as InputEvent).inputType ?? ''
    const kind: EditKind =
      type === 'insertText' ? 'type' : type.startsWith('deleteContent') ? 'delete' : 'other'
    commit(edit.text, at, at, kind)
  }

  // Keeps both ends of the selection off the gap rows.
  const onSelect = (e: SyntheticEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    const forward = el.selectionDirection !== 'backward'
    let anchor = forward ? el.selectionStart : el.selectionEnd
    let head = forward ? el.selectionEnd : el.selectionStart
    const collapsed = head === anchor
    const prev = lastSel.current
    const raw = head
    head = snapOffset(map, value, head, head >= prev.head ? 1 : -1, prev.column)
    anchor = collapsed ? head : snapOffset(map, value, anchor, head >= anchor ? 1 : -1, 0)
    const start = Math.min(anchor, head)
    const end = Math.max(anchor, head)
    if (start !== el.selectionStart || end !== el.selectionEnd) {
      el.setSelectionRange(start, end, head < anchor ? 'backward' : 'forward')
    }
    // After stepping over a gap, keep aiming for the column the caret had
    // before it, as the arrow keys do between long and short lines.
    lastSel.current = { head, column: head === raw ? head - rowOf(value, head).start : prev.column }
    sel.current = { anchor: toReal(anchor), head: toReal(head) }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget
    remember(el)
    const mod = e.metaKey || e.ctrlKey
    const key = e.key.toLowerCase()
    if (mod && !e.altKey && ((key === 'z' && e.shiftKey) || (key === 'y' && e.ctrlKey))) {
      e.preventDefault()
      redo()
      return
    }
    if (mod && !e.altKey && key === 'z') {
      e.preventDefault()
      undo()
      return
    }

    const s = toReal(el.selectionStart)
    const end = toReal(el.selectionEnd)
    const v = text
    const unit = ' '.repeat(tabSize)

    if (e.key === 'Escape') {
      setReleased(true)
      return
    }
    if (e.key === 'Tab') {
      if (released) {
        setReleased(false)
        return
      }
      e.preventDefault()
      const lineStart = v.lastIndexOf('\n', s - 1) + 1
      const multiLine = v.slice(s, end).includes('\n')
      if (!e.shiftKey && !multiLine) {
        commit(v.slice(0, s) + unit + v.slice(end), s + unit.length, s + unit.length, 'other')
        return
      }
      // Indent or outdent every line the selection touches — the same rules
      // as CodeEditor, applied to the side's text so the gaps stay empty.
      const lastChar = end > s && v[end - 1] === '\n' ? end - 1 : end
      const blockEnd = v.indexOf('\n', lastChar) === -1 ? v.length : v.indexOf('\n', lastChar)
      const block = v.slice(lineStart, blockEnd)
      const outdent = new RegExp(`^ {1,${tabSize}}`)
      const firstRemoved = e.shiftKey ? (block.match(outdent)?.[0].length ?? 0) : 0
      const next = block
        .split('\n')
        .map((l) => (e.shiftKey ? l.replace(outdent, '') : unit + l))
        .join('\n')
      if (next === block) return
      const out = v.slice(0, lineStart) + next + v.slice(blockEnd)
      if (multiLine) commit(out, lineStart, lineStart + next.length, 'other')
      else {
        const at = Math.max(lineStart, s - firstRemoved)
        commit(out, at, at, 'other')
      }
      return
    }
    setReleased(false)

    if (e.key === 'Enter' && !e.shiftKey && !mod && !e.altKey && !e.nativeEvent.isComposing) {
      const currentLine = v.slice(v.lastIndexOf('\n', s - 1) + 1, s)
      let indent = currentLine.match(/^ */)![0]
      if (/[{[]\s*$/.test(currentLine)) indent += unit
      else if (language === 'yaml' && /:\s*$/.test(currentLine)) indent += unit
      else if (language === 'yaml' && /^ *- \S/.test(currentLine)) indent += '- '
      e.preventDefault()
      const at = s + 1 + indent.length
      commit(v.slice(0, s) + '\n' + indent + v.slice(end), at, at, 'other')
      return
    }

    // Next to a gap, the browser would join the line to the empty stand-in.
    // Join it to the real line on the far side instead.
    if (el.selectionStart !== el.selectionEnd) return
    const row = rowOf(value, el.selectionStart)
    if (e.key === 'Backspace' && el.selectionStart === row.start && map[row.row - 1] === null) {
      e.preventDefault()
      if (s > 0) commit(v.slice(0, s - 1) + v.slice(s), s - 1, s - 1, 'delete')
    } else if (e.key === 'Delete' && el.selectionStart === row.end && map[row.row + 1] === null) {
      e.preventDefault()
      if (s < v.length) commit(v.slice(0, s) + v.slice(s + 1), s, s, 'delete')
    }
  }

  const markClass = (change: number | null) =>
    change !== null && change === current ? 'shadow-[inset_3px_0_0_var(--brand-fg)]' : ''

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className={`relative min-h-0 min-w-0 flex-1 basis-0 overflow-auto ${className}`}
    >
      <div ref={contentRef} className="flex min-h-full w-max min-w-full">
        {/* Line numbers stay put while the code scrolls sideways. */}
        <div
          aria-hidden="true"
          className="sticky left-0 z-10 shrink-0 bg-panel-solid font-mono text-[13px] leading-5 select-none"
        >
          {rows.map((row, i) => (
            <div
              key={i}
              data-change={row.change ?? undefined}
              style={row.kind === 'empty' ? HATCH : undefined}
              className={`flex h-5 ${tone[row.kind].row} ${markClass(row.change)}`}
            >
              {row.nums.map((n, k) => (
                <Gutter
                  key={k}
                  num={n}
                  kind={row.kind}
                  width={row.nums.length > 1 ? 'w-12' : 'w-13'}
                />
              ))}
              <Sign kind={row.kind} />
            </div>
          ))}
        </div>

        <div className="relative min-w-0 grow">
          <div aria-hidden={editable || undefined} className={metrics} style={{ tabSize }}>
            {rows.map((row, i) => (
              <div
                key={i}
                style={row.kind === 'empty' ? HATCH : undefined}
                className={`h-5 ${tone[row.kind].row}`}
              >
                <Tokens side={{ kind: row.kind, num: null, segments: row.segments }} />
              </div>
            ))}
          </div>

          {editable && (
            <textarea
              ref={ta}
              value={value}
              onChange={onInput}
              onKeyDown={onKeyDown}
              onSelect={onSelect}
              onBlur={() => setReleased(false)}
              aria-label={label}
              aria-describedby={helpId}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              wrap="off"
              style={{ tabSize }}
              className={`${metrics} absolute inset-0 size-full resize-none overflow-hidden border-0 bg-transparent text-transparent caret-ink-strong outline-none`}
            />
          )}
        </div>
      </div>
      {editable && (
        <span id={helpId} className="sr-only">
          {`${languageLabels[language]}. Tab indents. Press Escape, then Tab, to leave the editor.`}
        </span>
      )}
    </div>
  )
}
