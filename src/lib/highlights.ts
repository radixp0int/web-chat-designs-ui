// Pure, framework-agnostic helpers for highlighting passages of markdown
// (used for the cited source docs in the reference panel). Kept separate from
// React so the offset math is easy to reason about (and test) on its own.
//
// The whole point: highlight offsets index the *original* markdown. The naive
// approach — inserting `==` (or any wrapper) around each range in place —
// shifts every later range by the number of characters inserted, so the second
// range lands `start+N` too far. `markRanges` sidesteps that entirely by
// rebuilding the string from the original offsets in one pass, so no range ever
// moves the goalposts for another.

import type { Highlight, Source } from './types'

/** A resolved span to wrap, as offsets into the answer text. */
export type HighlightRange = { start: number; end: number }

// Wrapper emitted around a highlighted span. Rendered as a real element once
// react-markdown reparses raw HTML (see Markdown.tsx). `data-hl` is the hook a
// surface can use to find the active highlight.
const OPEN = '<mark data-hl="true">'
const CLOSE = '</mark>'

/**
 * The ranges to highlight for a given citation marker. Finds the highlight
 * group whose `referenceNumber` matches (one chip → many sections), clamps its
 * sections to the text, drops empties, sorts by start, and removes overlaps so
 * `markRanges` can rebuild in a single clean pass.
 */
export function rangesForReference(
  highlights: Highlight[] | undefined,
  referenceNumber: number | null,
  textLength: number,
): HighlightRange[] {
  if (!highlights?.length || referenceNumber == null) return []
  const group = highlights.find((h) => h.referenceNumber === referenceNumber)
  if (!group) return []

  const clamped = group.sections
    .map((s) => ({
      start: Math.max(0, Math.min(s.start, textLength)),
      end: Math.max(0, Math.min(s.end, textLength)),
    }))
    .filter((r) => r.end > r.start)
    .sort((a, b) => a.start - b.start)

  // Drop any range that overlaps the one before it — a rebuild pass needs
  // strictly non-overlapping, ascending spans.
  const out: HighlightRange[] = []
  for (const r of clamped) {
    const last = out[out.length - 1]
    if (!last || r.start >= last.end) out.push(r)
  }
  return out
}

/**
 * Wraps each range of `text` in a `<mark>`, rebuilding the string from the
 * original offsets so multiple ranges never drift. `ranges` must be ascending
 * and non-overlapping (see `rangesForReference`).
 */
export function markRanges(text: string, ranges: HighlightRange[]): string {
  if (!ranges.length) return text
  let out = ''
  let cursor = 0
  for (const { start, end } of ranges) {
    if (start < cursor) continue // defensive: skip stragglers that overlap
    out += text.slice(cursor, start) + OPEN + text.slice(start, end) + CLOSE
    cursor = end
  }
  return out + text.slice(cursor)
}

/**
 * Authoring helper for mock data: turns `{ referenceNumber, phrase }` specs
 * into the nested highlight shape by locating each phrase in the matching
 * source's markdown (the source whose `id` equals `referenceNumber`). Sections
 * are grouped by `referenceNumber` and each gets a unique running `idx`. Keeps
 * mock offsets correct without hand-counting; unfound phrases are skipped.
 */
export function sourceHighlights(
  sources: Source[],
  specs: { referenceNumber: number; phrase: string }[],
): Highlight[] {
  const groups = new Map<number, Highlight>()
  let idx = 1
  for (const { referenceNumber, phrase } of specs) {
    const source = sources.find((s) => s.id === referenceNumber)
    if (!source) continue
    const start = source.markdown.indexOf(phrase)
    if (start === -1) continue
    const section = { idx: idx++, start, end: start + phrase.length }
    const group = groups.get(referenceNumber)
    if (group) group.sections.push(section)
    else groups.set(referenceNumber, { referenceNumber, sections: [section] })
  }
  return [...groups.values()]
}
