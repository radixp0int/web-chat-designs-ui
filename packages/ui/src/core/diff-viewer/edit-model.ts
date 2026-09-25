/**
 * The bookkeeping behind an editable diff pane, kept free of React.
 *
 * A pane shows one side's lines interleaved with placeholder rows — the
 * hatched gaps that keep the two sides level. Its textarea has to have a line
 * for every row, or the caret would sit on the wrong row, so each placeholder
 * is an empty line in the textarea text. `map` says which is which: for every
 * row, the index of the side's own line it shows, or `null` for a placeholder.
 *
 * Edits go the other way. The browser hands back the whole new textarea text;
 * `readEdit` works out which rows the edit touched, drops the placeholders it
 * left alone and returns the side's real text.
 */

/** A position in the side's own text — line and column, both 0-based. */
export type Caret = { line: number; column: number }

export type RowMap = readonly (number | null)[]

/** The textarea's text: the side's lines in row order, an empty line per placeholder. */
export function paneText(map: RowMap, lines: readonly string[]): string {
  return map.map((l) => (l === null ? '' : lines[l])).join('\n')
}

function rowStarts(text: string): number[] {
  const out = [0]
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') out.push(i + 1)
  return out
}

function rowAt(starts: readonly number[], offset: number): number {
  let lo = 0
  let hi = starts.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (starts[mid] <= offset) lo = mid
    else hi = mid - 1
  }
  return lo
}

function newlines(text: string, from: number, to: number): number {
  let n = 0
  for (let i = from; i < to; i++) if (text[i] === '\n') n++
  return n
}

/** The row an offset of the textarea text falls on, and where that row starts and ends. */
export function rowOf(text: string, offset: number) {
  const starts = rowStarts(text)
  const row = rowAt(starts, offset)
  const end = row + 1 < starts.length ? starts[row + 1] - 1 : text.length
  return { row, start: starts[row], end }
}

/** Textarea offset → side caret. A placeholder row lands on the next real line, or the last one. */
export function toCaret(map: RowMap, text: string, offset: number): Caret {
  const starts = rowStarts(text)
  const row = rowAt(starts, offset)
  if (map[row] !== null) return { line: map[row]!, column: offset - starts[row] }
  for (let r = row + 1; r < map.length; r++)
    if (map[r] !== null) return { line: map[r]!, column: 0 }
  for (let r = row - 1; r >= 0; r--) {
    if (map[r] !== null) {
      const end = r + 1 < starts.length ? starts[r + 1] - 1 : text.length
      return { line: map[r]!, column: end - starts[r] }
    }
  }
  return { line: 0, column: 0 }
}

/** Side caret → textarea offset. */
export function toOffset(map: RowMap, text: string, caret: Caret): number {
  const starts = rowStarts(text)
  const row = map.indexOf(caret.line)
  if (row < 0) return text.length
  const end = row + 1 < starts.length ? starts[row + 1] - 1 : text.length
  return Math.min(starts[row] + caret.column, end)
}

/**
 * Moves an offset that sits on a placeholder row to the nearest real row in
 * `dir` (1 down, -1 up), at `column` where the line is long enough — so the
 * arrow keys step over a gap instead of stopping in it.
 */
export function snapOffset(
  map: RowMap,
  text: string,
  offset: number,
  dir: 1 | -1,
  column: number,
): number {
  const starts = rowStarts(text)
  const row = rowAt(starts, offset)
  if (map[row] !== null) return offset
  const end = (r: number) => (r + 1 < starts.length ? starts[r + 1] - 1 : text.length)
  for (const d of [dir, -dir]) {
    for (let r = row + d; r >= 0 && r < map.length; r += d) {
      if (map[r] !== null) return Math.min(starts[r] + column, end(r))
    }
  }
  return offset
}

/** Side caret ↔ offset in the side's own text. */
export function caretToIndex(text: string, caret: Caret): number {
  const starts = rowStarts(text)
  const row = Math.min(caret.line, starts.length - 1)
  const end = row + 1 < starts.length ? starts[row + 1] - 1 : text.length
  return Math.min(starts[row] + caret.column, end)
}

export function indexToCaret(text: string, index: number): Caret {
  const starts = rowStarts(text)
  const line = rowAt(starts, index)
  return { line, column: index - starts[line] }
}

/**
 * Reads one browser edit of the textarea back into the side's own text.
 *
 * The changed span is the text between the longest common prefix and suffix,
 * with the prefix capped at where the caret says the edit began — typing a
 * newline next to an empty placeholder line is otherwise ambiguous about which
 * of the two empty lines is new. Rows outside the span keep what they were.
 * Rows inside it are real lines, except an empty first or last row that was a
 * placeholder and only bordered the edit.
 */
export function readEdit(
  map: RowMap,
  before: string,
  after: string,
  caretAfter: number,
): { text: string; caret: Caret } {
  const grew = Math.max(0, after.length - before.length)
  const prefixMax = Math.min(before.length, after.length, Math.max(0, caretAfter - grew))
  let p = 0
  while (p < prefixMax && before[p] === after[p]) p++
  const suffixMax = Math.min(before.length, after.length) - p
  let s = 0
  while (s < suffixMax && before[before.length - 1 - s] === after[after.length - 1 - s]) s++

  const first = newlines(before, 0, p)
  const lastOld = first + newlines(before, p, before.length - s)
  const lastNew = first + newlines(after, p, after.length - s)
  const real = (r: number) => map[r] !== null

  const rows = after.split('\n')
  const keep = rows.map((text, r) => {
    if (r < first) return real(r)
    if (r > lastNew) return real(r - lastNew + lastOld)
    if (text) return true
    if (first === lastNew) return real(first) || real(lastOld)
    if (r === first) return real(first)
    if (r === lastNew) return real(lastOld)
    return true
  })

  // Where the caret ends up, counted in real lines.
  const starts = rowStarts(after)
  const caretRow = rowAt(starts, caretAfter)
  const realBefore = (r: number) => keep.slice(0, r).filter(Boolean).length
  let caret: Caret
  if (keep[caretRow]) {
    caret = { line: realBefore(caretRow), column: caretAfter - starts[caretRow] }
  } else {
    const next = keep.indexOf(true, caretRow)
    if (next >= 0) caret = { line: realBefore(next), column: 0 }
    else {
      const prev = keep.lastIndexOf(true, caretRow)
      caret = { line: Math.max(0, realBefore(prev)), column: prev >= 0 ? rows[prev].length : 0 }
    }
  }

  return { text: rows.filter((_, r) => keep[r]).join('\n'), caret }
}
