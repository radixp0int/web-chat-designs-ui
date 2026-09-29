type TextMatch = {
  start: number
  end: number
  line: number
  column: number
}

export function findTextMatches(source: string, query: string): TextMatch[] {
  if (!query) return []
  const matches: TextMatch[] = []
  const haystack = source.toLocaleLowerCase()
  const needle = query.toLocaleLowerCase()
  let start = 0
  while (start <= source.length - needle.length) {
    const found = haystack.indexOf(needle, start)
    if (found < 0) break
    const before = source.slice(0, found).split('\n')
    matches.push({
      start: found,
      end: found + query.length,
      line: before.length,
      column: before[before.length - 1].length,
    })
    start = found + needle.length
  }
  return matches
}

export function replaceAllText(source: string, matches: TextMatch[], replacement: string): string {
  let next = source
  for (let i = matches.length - 1; i >= 0; i--) {
    next = next.slice(0, matches[i].start) + replacement + next.slice(matches[i].end)
  }
  return next
}

type SearchPart<T> = { source: T; text: string; matchStart: number | null }

/** Split styled source runs at search boundaries without losing their original metadata. */
export function splitSearchParts<T extends { text: string }>(
  parts: T[],
  query: string,
): SearchPart<T>[] {
  if (!query) return parts.map((source) => ({ source, text: source.text, matchStart: null }))
  const text = parts.map((part) => part.text).join('')
  const ranges = findTextMatches(text, query)
  if (!ranges.length)
    return parts.map((source) => ({ source, text: source.text, matchStart: null }))
  const out: SearchPart<T>[] = []
  let offset = 0
  for (const source of parts) {
    const start = offset
    const end = start + source.text.length
    const cuts = new Set([start, end])
    for (const match of ranges) {
      if (match.start > start && match.start < end) cuts.add(match.start)
      if (match.end > start && match.end < end) cuts.add(match.end)
    }
    const sorted = [...cuts].sort((a, b) => a - b)
    for (let i = 0; i < sorted.length - 1; i++) {
      const from = sorted[i]
      const to = sorted[i + 1]
      if (to <= from) continue
      const match = ranges.find((range) => from >= range.start && to <= range.end)
      out.push({ source, text: text.slice(from, to), matchStart: match?.start ?? null })
    }
    offset = end
  }
  return out
}
