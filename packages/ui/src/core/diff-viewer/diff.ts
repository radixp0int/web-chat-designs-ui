/**
 * Myers' O(ND) diff over any two sequences of strings — lines for the file,
 * word-ish tokens inside a changed line. Cost grows with the size of the
 * change (D), not with the product of the lengths, so a one-line edit to a
 * five-thousand-line file is cheap.
 */

export type DiffOp =
  | { type: 'equal'; a: number; b: number }
  | { type: 'delete'; a: number }
  | { type: 'insert'; b: number }

export function myersDiff(a: readonly string[], b: readonly string[]): DiffOp[] {
  const n = a.length
  const m = b.length
  const max = n + m
  const offset = max + 1
  const v = new Int32Array(2 * max + 3)
  const trace: Int32Array[] = []

  // Forward pass: for each edit distance d, the furthest-reaching x on each
  // diagonal k. `trace` keeps every round so the path can be walked back.
  let found = false
  for (let d = 0; d <= max && !found; d++) {
    trace.push(v.slice())
    for (let k = -d; k <= d; k += 2) {
      let x =
        k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])
          ? v[offset + k + 1]
          : v[offset + k - 1] + 1
      let y = x - k
      while (x < n && y < m && a[x] === b[y]) {
        x++
        y++
      }
      v[offset + k] = x
      if (x >= n && y >= m) {
        found = true
        break
      }
    }
  }

  // Backward pass: from (n, m), step to the diagonal each round came from.
  const ops: DiffOp[] = []
  let x = n
  let y = m
  for (let d = trace.length - 1; d >= 0; d--) {
    const t = trace[d]
    const k = x - y
    const prevK = k === -d || (k !== d && t[offset + k - 1] < t[offset + k + 1]) ? k + 1 : k - 1
    const prevX = t[offset + prevK]
    const prevY = prevX - prevK
    while (x > prevX && y > prevY) {
      ops.push({ type: 'equal', a: --x, b: --y })
    }
    if (d > 0) {
      if (x === prevX) ops.push({ type: 'insert', b: --y })
      else ops.push({ type: 'delete', a: --x })
    }
    x = prevX
    y = prevY
  }
  return ops.reverse()
}

/** A run of unchanged lines, or one change: the lines it removed and the lines it added. */
export type DiffBlock =
  | { type: 'equal'; pairs: { a: number; b: number }[] }
  | { type: 'change'; deleted: number[]; inserted: number[] }

export function diffBlocks(a: readonly string[], b: readonly string[]): DiffBlock[] {
  const blocks: DiffBlock[] = []
  for (const op of myersDiff(a, b)) {
    const last = blocks[blocks.length - 1]
    if (op.type === 'equal') {
      if (last?.type === 'equal') last.pairs.push({ a: op.a, b: op.b })
      else blocks.push({ type: 'equal', pairs: [{ a: op.a, b: op.b }] })
    } else {
      const block: DiffBlock =
        last?.type === 'change' ? last : { type: 'change', deleted: [], inserted: [] }
      if (block !== last) blocks.push(block)
      if (op.type === 'delete') block.deleted.push(op.a)
      else block.inserted.push(op.b)
    }
  }
  return blocks
}

/** [start, end) character offsets. */
export type Range = [number, number]

const WORDS = /\s+|\w+|[^\s\w]/g

/**
 * The character ranges that differ inside a changed line pair — what gets the
 * stronger wash. Split into words, whitespace runs and single symbols, so
 * `maxLength: 2000` → `4000` marks the number and not the key.
 */
export function changedRanges(before: string, after: string): [Range[], Range[]] {
  const A = before.match(WORDS) ?? []
  const B = after.match(WORDS) ?? []
  const left: Range[] = []
  const right: Range[] = []
  const push = (into: Range[], start: number, end: number) => {
    const last = into[into.length - 1]
    if (last && last[1] === start) last[1] = end
    else into.push([start, end])
  }
  const starts = (tokens: string[]) => {
    const out: number[] = []
    let pos = 0
    for (const t of tokens) {
      out.push(pos)
      pos += t.length
    }
    return out
  }
  const startsA = starts(A)
  const startsB = starts(B)

  for (const op of myersDiff(A, B)) {
    if (op.type === 'delete') push(left, startsA[op.a], startsA[op.a] + A[op.a].length)
    else if (op.type === 'insert') push(right, startsB[op.b], startsB[op.b] + B[op.b].length)
  }
  return [left, right]
}

/** Share of the two lines' characters that the word diff leaves unchanged, 0–1. */
function similarity(before: string, after: string): number {
  const total = before.length + after.length
  if (!total) return 1
  const [left, right] = changedRanges(before, after)
  const changed = [...left, ...right].reduce((sum, [s, e]) => sum + e - s, 0)
  return (total - changed) / total
}

/** One row of a change: indices into its removed and added lines, either side possibly absent. */
export type AlignedRow = { deleted: number | null; inserted: number | null; similar: boolean }

/**
 * Lines up a change's removed lines against its added ones. Pairing the i-th
 * with the i-th is wrong as soon as a change also inserts a line — `topK: 5`
 * ends up word-diffed against `- faqs` — so each removed line is matched to
 * the next added line that is recognisably an edit of it, and only those
 * pairs get a word diff. Everything in between sits side by side unpaired.
 * The look-ahead is bounded so one huge change block stays linear.
 */
export function alignChange(
  deleted: readonly string[],
  inserted: readonly string[],
  threshold = 0.4,
  lookAhead = 8,
): AlignedRow[] {
  const rows: AlignedRow[] = []
  const flush = (dels: number[], from: number, to: number) => {
    const n = Math.max(dels.length, to - from)
    for (let k = 0; k < n; k++) {
      rows.push({
        deleted: k < dels.length ? dels[k] : null,
        inserted: from + k < to ? from + k : null,
        similar: false,
      })
    }
  }

  let j = 0
  let pending: number[] = []
  deleted.forEach((line, i) => {
    let match = -1
    for (let c = j; c < Math.min(inserted.length, j + lookAhead); c++) {
      if (similarity(line, inserted[c]) >= threshold) {
        match = c
        break
      }
    }
    if (match < 0) {
      pending.push(i)
      return
    }
    flush(pending, j, match)
    pending = []
    rows.push({ deleted: i, inserted: match, similar: true })
    j = match + 1
  })
  flush(pending, j, inserted.length)
  return rows
}
