import type { CodeDiagnostic, CodeLanguage, CodeToken, CodeTokenKind } from './types'

/**
 * Line tokenizers for the three languages the editor speaks.
 *
 * Per line, not per document, because nothing in JSON or in the YAML subset we
 * colour spans a line break — and a per-line tokenizer is what lets the diff
 * viewer highlight a single line out of context with the same function.
 *
 * The one invariant every tokenizer keeps: the tokens' text, concatenated, is
 * the line exactly. The highlight layer sits under a transparent textarea, so a
 * dropped or doubled character shifts every glyph after it off the caret.
 */

const JSON_TOKEN =
  /("(?:[^"\\]|\\.)*"?)(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|(true|false|null)\b|([{}[\],:])|(\s+)|([^\s"{}[\],:]+)/g

function tokenizeJson(line: string): CodeToken[] {
  const out: CodeToken[] = []
  for (const m of line.matchAll(JSON_TOKEN)) {
    if (m[1] !== undefined) {
      out.push({ kind: m[2] ? 'key' : 'string', text: m[1] })
      if (m[2]) out.push({ kind: 'punctuation', text: m[2] })
    } else if (m[3] !== undefined) out.push({ kind: 'number', text: m[3] })
    else if (m[4] !== undefined) out.push({ kind: 'literal', text: m[4] })
    else if (m[5] !== undefined) out.push({ kind: 'punctuation', text: m[5] })
    else if (m[6] !== undefined) out.push({ kind: 'space', text: m[6] })
    else out.push({ kind: 'invalid', text: m[7] })
  }
  return out
}

function yamlScalarKind(value: string): CodeTokenKind {
  if (/^"[^"]*"$/.test(value) || /^'[^']*'$/.test(value)) return 'string'
  if (/^[-+]?\d[\d_]*(\.\d+)?([eE][-+]?\d+)?$/.test(value)) return 'number'
  if (/^(true|false|yes|no|on|off|null|~)$/i.test(value)) return 'literal'
  // Block-scalar indicators (`|`, `>-`), anchors, aliases and tags.
  if (/^[|>][-+]?\d*$/.test(value) || /^[&*!]\S+$/.test(value)) return 'literal'
  return 'string'
}

/**
 * Enough YAML to colour a config file: comments, keys, list dashes, and
 * scalars by type. Flow collections (`[a, b]`) and multi-line scalars colour
 * as plain strings — wrong-looking at worst, never misaligned.
 */
function tokenizeYaml(line: string): CodeToken[] {
  const out: CodeToken[] = []
  if (!line) return out
  if (/^\s*$/.test(line)) return [{ kind: 'space', text: line }]
  if (/^(---|\.\.\.)\s*$/.test(line)) return [{ kind: 'punctuation', text: line }]

  const lead = line.match(/^(\s*)(-\s+|-$)?/)!
  if (lead[1]) out.push({ kind: 'space', text: lead[1] })
  if (lead[2]) out.push({ kind: 'punctuation', text: lead[2] })
  let rest = line.slice(lead[0].length)

  if (rest.startsWith('#')) {
    out.push({ kind: 'comment', text: rest })
    return out
  }

  const key = rest.match(/^("[^"]*"|'[^']*'|[^\s#:"'][^#:]*?)(\s*):(?=\s|$)/)
  if (key) {
    out.push({ kind: 'key', text: key[1] })
    out.push({ kind: 'punctuation', text: `${key[2]}:` })
    rest = rest.slice(key[0].length)
  }

  // A `#` starts a comment only outside quotes and after whitespace —
  // `color: #fff` is a comment, `url: a#b` is not.
  let quote: string | null = null
  let cut = -1
  for (let i = 0; i < rest.length; i++) {
    const c = rest[i]
    if (quote) {
      if (c === quote) quote = null
    } else if (c === '"' || c === "'") quote = c
    else if (c === '#' && (i === 0 || /\s/.test(rest[i - 1]))) {
      cut = i
      break
    }
  }
  const value = cut >= 0 ? rest.slice(0, cut) : rest
  const comment = cut >= 0 ? rest.slice(cut) : ''

  const before = value.match(/^\s*/)![0]
  const core = value.slice(before.length).replace(/\s+$/, '')
  const after = value.slice(before.length + core.length)
  if (!core) {
    if (value) out.push({ kind: 'space', text: value })
  } else {
    if (before) out.push({ kind: 'space', text: before })
    out.push({ kind: yamlScalarKind(core), text: core })
    if (after) out.push({ kind: 'space', text: after })
  }
  if (comment) out.push({ kind: 'comment', text: comment })
  return out
}

export function tokenizeLine(language: CodeLanguage, line: string): CodeToken[] {
  if (language === 'json') return tokenizeJson(line)
  if (language === 'yaml') return tokenizeYaml(line)
  return line ? [{ kind: 'plain', text: line }] : []
}

/**
 * `JSON.parse` is the validator. What differs between engines is only where
 * the position is in the message: V8 says `position N (line L column C)`,
 * SpiderMonkey `at line L column C`, and JavaScriptCore gives none, in which
 * case the error is pinned to the end of the document.
 */
function lintJson(source: string): CodeDiagnostic | null {
  try {
    JSON.parse(source)
    return null
  } catch (e) {
    const raw = e instanceof Error ? e.message : String(e)
    let line: number
    let column: number
    const lc = raw.match(/line (\d+) column (\d+)/)
    if (lc) {
      line = Number(lc[1])
      column = Number(lc[2])
    } else {
      const pos = raw.match(/position (\d+)/)
      const before = source.slice(0, pos ? Number(pos[1]) : source.length).split('\n')
      line = before.length
      column = before[before.length - 1].length + 1
    }
    const message = raw
      .replace(/^JSON\.parse: /, '')
      .replace(/^JSON Parse error: /, '')
      .replace(/ in JSON at position \d+.*$/, '')
      .replace(/ at line \d+ column \d+ of the JSON data$/, '')
    return { line, column, message: message.charAt(0).toUpperCase() + message.slice(1) }
  }
}

/**
 * Not a YAML parser — the two mistakes a hand-edited config actually makes.
 * A caller that needs real validation passes its own `validate`.
 */
function lintYaml(source: string): CodeDiagnostic | null {
  const lines = source.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const tab = lines[i].match(/^ *\t/)
    if (tab) {
      return { line: i + 1, column: tab[0].length, message: 'Tabs can’t be used for indentation' }
    }
    let column = 1
    for (const t of tokenizeYaml(lines[i])) {
      const q = t.text[0]
      const quoted = (t.kind === 'string' || t.kind === 'key') && (q === '"' || q === "'")
      if (quoted && (t.text.length < 2 || t.text[t.text.length - 1] !== q)) {
        return { line: i + 1, column, message: 'Unterminated quoted string' }
      }
      column += t.text.length
    }
  }
  return null
}

export function lintCode(language: CodeLanguage, source: string): CodeDiagnostic | null {
  if (language === 'json') return lintJson(source)
  if (language === 'yaml') return lintYaml(source)
  return null
}

/** Pretty-prints JSON at the given indent. Anything else — or invalid JSON — comes back as is. */
export function formatCode(language: CodeLanguage, source: string, indent = 2): string {
  if (language !== 'json') return source
  try {
    return JSON.stringify(JSON.parse(source), null, indent)
  } catch {
    return source
  }
}

export const languageLabels: Record<CodeLanguage, string> = {
  json: 'JSON',
  yaml: 'YAML',
  text: 'Plain text',
}

/**
 * Token colours, from the brand's own names so a `chat-theme-*` switch and
 * dark mode carry through. brand.css runs one hue plus the ember ramp, so the
 * palette is built from lightness as much as hue: keys are the brand blue,
 * strings the contrast-checked warm (`--caution`, ember 600 / 300), numbers
 * and literals a deeper step of the blue, structure recedes to --ink-soft.
 *
 * Nothing here changes weight: the highlight layer has to keep the textarea's
 * glyph advances exactly, and a bold run in some monospace fallbacks does not.
 * Italic is safe — every monospace face keeps its advance when slanted.
 */
export const tokenClass: Record<CodeTokenKind, string> = {
  key: 'text-brand-fg',
  string: 'text-caution',
  number: 'text-brand-700 dark:text-brand-200',
  literal: 'text-brand-700 italic dark:text-brand-200',
  punctuation: 'text-ink-soft',
  comment: 'text-ink-soft italic',
  invalid: 'text-danger-fg',
  plain: 'text-ink',
  space: '',
}
