import type { CodeDiagnostic, CodeLanguage, CodeToken, CodeTokenKind } from './types'

/**
 * Line tokenizers for the languages the editor speaks.
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

function csvScalarKind(value: string): CodeTokenKind {
  if (/^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/.test(value)) return 'number'
  if (/^(true|false|null)$/i.test(value)) return 'literal'
  return 'string'
}

/**
 * CSV highlighting is intentionally line-local so the diff viewer can colour
 * an isolated line with the same function. Document-level validation below
 * still understands quoted fields that span line breaks.
 */
function tokenizeCsv(line: string): CodeToken[] {
  const out: CodeToken[] = []
  let i = 0
  while (i < line.length) {
    if (line[i] === ',') {
      out.push({ kind: 'punctuation', text: ',' })
      i++
      continue
    }

    const start = i
    if (line[i] === '"') {
      i++
      while (i < line.length) {
        if (line[i] !== '"') {
          i++
          continue
        }
        if (line[i + 1] === '"') {
          i += 2
          continue
        }
        i++
        break
      }
      out.push({ kind: 'string', text: line.slice(start, i) })
      continue
    }

    while (i < line.length && line[i] !== ',') i++
    const cell = line.slice(start, i)
    const leading = cell.match(/^\s*/)![0]
    const core = cell.slice(leading.length).replace(/\s+$/, '')
    const trailing = cell.slice(leading.length + core.length)
    if (leading) out.push({ kind: 'space', text: leading })
    if (core) out.push({ kind: csvScalarKind(core), text: core })
    if (trailing) out.push({ kind: 'space', text: trailing })
  }
  return out
}

const HTML_ENTITY = /^&(?:#\d+|#x[\da-f]+|[a-z][\w-]*);/i

function tokenizeHtmlText(text: string): CodeToken[] {
  const out: CodeToken[] = []
  let i = 0
  while (i < text.length) {
    const entity = text.slice(i).match(HTML_ENTITY)?.[0]
    if (entity) {
      out.push({ kind: 'literal', text: entity })
      i += entity.length
      continue
    }
    const next = text.indexOf('&', i + 1)
    const end = next < 0 ? text.length : next
    out.push({
      kind: /^\s+$/.test(text.slice(i, end)) ? 'space' : 'plain',
      text: text.slice(i, end),
    })
    i = end
  }
  return out
}

function tokenizeHtmlTag(tag: string): CodeToken[] {
  if (tag.startsWith('<!--') || /^<!doctype\b/i.test(tag)) {
    return [{ kind: 'comment', text: tag }]
  }
  const out: CodeToken[] = []
  let i = 0
  let nameSeen = false
  while (i < tag.length) {
    const rest = tag.slice(i)
    const punctuation = rest.match(/^(?:<\/|\/>|[<>=])/)?.[0]
    if (punctuation) {
      out.push({ kind: 'punctuation', text: punctuation })
      i += punctuation.length
      continue
    }
    const space = rest.match(/^\s+/)?.[0]
    if (space) {
      out.push({ kind: 'space', text: space })
      i += space.length
      continue
    }
    const quoted = rest.match(/^(?:"[^"]*"|'[^']*')/)?.[0]
    if (quoted) {
      out.push({ kind: 'string', text: quoted })
      i += quoted.length
      continue
    }
    const word = rest.match(/^[^\s<>=]+/)?.[0]
    if (word) {
      out.push({ kind: nameSeen ? 'key' : 'literal', text: word })
      nameSeen = true
      i += word.length
      continue
    }
    out.push({ kind: 'invalid', text: tag[i++] })
  }
  return out
}

/** Line-local HTML colouring. Document validation and formatting remain document-aware. */
function tokenizeHtml(line: string): CodeToken[] {
  const out: CodeToken[] = []
  let i = 0
  while (i < line.length) {
    if (line.startsWith('<!--', i)) {
      const close = line.indexOf('-->', i + 4)
      const end = close < 0 ? line.length : close + 3
      out.push({ kind: 'comment', text: line.slice(i, end) })
      i = end
      continue
    }
    if (line[i] === '<') {
      let quote: string | null = null
      let end = i + 1
      for (; end < line.length; end++) {
        const char = line[end]
        if (quote) {
          if (char === quote) quote = null
        } else if (char === '"' || char === "'") quote = char
        else if (char === '>') {
          end++
          break
        }
      }
      out.push(...tokenizeHtmlTag(line.slice(i, end)))
      i = end
      continue
    }
    const next = line.indexOf('<', i)
    const end = next < 0 ? line.length : next
    out.push(...tokenizeHtmlText(line.slice(i, end)))
    i = end
  }
  return out
}

export function tokenizeLine(language: CodeLanguage, line: string): CodeToken[] {
  if (language === 'json') return tokenizeJson(line)
  if (language === 'yaml') return tokenizeYaml(line)
  if (language === 'csv') return tokenizeCsv(line)
  if (language === 'html') return tokenizeHtml(line)
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

type CsvParse = {
  rows: string[][]
  diagnostic: CodeDiagnostic | null
}

/** RFC 4180-style parser used by validation and formatting. */
function parseCsv(source: string): CsvParse {
  if (!source) return { rows: [], diagnostic: null }

  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  let afterQuote = false
  let quoteLine = 1
  let quoteColumn = 1
  let line = 1
  let column = 1

  const pushField = () => {
    row.push(field)
    field = ''
    afterQuote = false
  }
  const pushRow = () => {
    pushField()
    rows.push(row)
    row = []
  }

  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    const newline = char === '\n' || char === '\r'
    const crlf = char === '\r' && source[i + 1] === '\n'

    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"'
          i++
          column += 2
          continue
        }
        quoted = false
        afterQuote = true
        column++
        continue
      }
      if (newline) {
        field += '\n'
        if (crlf) i++
        line++
        column = 1
        continue
      }
      field += char
      column++
      continue
    }

    if (afterQuote) {
      if (char === ',') {
        pushField()
        column++
        continue
      }
      if (newline) {
        pushRow()
        if (crlf) i++
        line++
        column = 1
        continue
      }
      return {
        rows,
        diagnostic: { line, column, message: 'Unexpected character after closing quote' },
      }
    }

    if (char === '"') {
      if (field.length > 0) {
        return { rows, diagnostic: { line, column, message: 'Quote must start a field' } }
      }
      quoted = true
      quoteLine = line
      quoteColumn = column
      column++
      continue
    }
    if (char === ',') {
      pushField()
      column++
      continue
    }
    if (newline) {
      pushRow()
      if (crlf) i++
      line++
      column = 1
      continue
    }
    field += char
    column++
  }

  if (quoted) {
    return {
      rows,
      diagnostic: { line: quoteLine, column: quoteColumn, message: 'Unterminated quoted field' },
    }
  }
  if (row.length > 0 || field || afterQuote || !/[\r\n]$/.test(source)) pushRow()
  return { rows, diagnostic: null }
}

function lintCsv(source: string): CodeDiagnostic | null {
  return parseCsv(source).diagnostic
}

/** Lexical HTML checks only; optional end tags make a small structural validator misleading. */
function lintHtml(source: string): CodeDiagnostic | null {
  let line = 1
  let column = 1
  let i = 0
  const advance = (text: string) => {
    const parts = text.split('\n')
    if (parts.length === 1) column += text.length
    else {
      line += parts.length - 1
      column = parts[parts.length - 1].length + 1
    }
  }
  while (i < source.length) {
    if (source[i] !== '<') {
      advance(source[i++])
      continue
    }
    const startLine = line
    const startColumn = column
    if (source.startsWith('<!--', i)) {
      const close = source.indexOf('-->', i + 4)
      if (close < 0)
        return { line: startLine, column: startColumn, message: 'Unterminated comment' }
      const token = source.slice(i, close + 3)
      advance(token)
      i = close + 3
      continue
    }
    let quote: string | null = null
    let end = i + 1
    for (; end < source.length; end++) {
      const char = source[end]
      if (quote) {
        if (char === quote) quote = null
      } else if (char === '"' || char === "'") quote = char
      else if (char === '>') break
    }
    if (end >= source.length) {
      return {
        line: startLine,
        column: startColumn,
        message: quote ? 'Unterminated attribute value' : 'Unterminated tag',
      }
    }
    const token = source.slice(i, end + 1)
    const rawName = token.match(/^<\s*(script|style|pre|textarea)\b/i)?.[1]
    if (rawName && !/\/\s*>$/.test(token)) {
      const closePattern = new RegExp(`<\\/\\s*${rawName}\\s*>`, 'gi')
      closePattern.lastIndex = end + 1
      const close = closePattern.exec(source)
      if (!close) {
        return {
          line: startLine,
          column: startColumn,
          message: `Missing closing ${rawName.toLowerCase()} tag`,
        }
      }
      const raw = source.slice(i, close.index + close[0].length)
      advance(raw)
      i = close.index + close[0].length
      continue
    }
    advance(token)
    i = end + 1
  }
  return null
}

export function lintCode(language: CodeLanguage, source: string): CodeDiagnostic | null {
  if (language === 'json') return lintJson(source)
  if (language === 'yaml') return lintYaml(source)
  if (language === 'csv') return lintCsv(source)
  if (language === 'html') return lintHtml(source)
  return null
}

function quoteCsvField(value: string): string {
  return /[",\r\n]/.test(value) || /^\s|\s$/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

const HTML_VOID = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])
const HTML_BLOCK = new Set([
  'address',
  'article',
  'aside',
  'base',
  'blockquote',
  'body',
  'div',
  'dl',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'html',
  'li',
  'link',
  'main',
  'meta',
  'nav',
  'ol',
  'p',
  'section',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'ul',
])
const HTML_RAW = new Set(['pre', 'script', 'style', 'textarea'])

type HtmlPart = {
  text: string
  name?: string
  closing?: boolean
  selfClosing?: boolean
  raw?: boolean
}

function htmlParts(source: string): HtmlPart[] | null {
  const parts: HtmlPart[] = []
  let i = 0
  while (i < source.length) {
    if (source[i] !== '<') {
      const next = source.indexOf('<', i)
      const end = next < 0 ? source.length : next
      parts.push({ text: source.slice(i, end) })
      i = end
      continue
    }
    if (source.startsWith('<!--', i)) {
      const close = source.indexOf('-->', i + 4)
      if (close < 0) return null
      parts.push({ text: source.slice(i, close + 3), selfClosing: true })
      i = close + 3
      continue
    }
    let quote: string | null = null
    let end = i + 1
    for (; end < source.length; end++) {
      const char = source[end]
      if (quote) {
        if (char === quote) quote = null
      } else if (char === '"' || char === "'") quote = char
      else if (char === '>') break
    }
    if (end >= source.length) return null
    const tag = source.slice(i, end + 1)
    const match = tag.match(/^<\s*(\/?)\s*([a-z][\w:-]*)/i)
    const name = match?.[2].toLowerCase()
    const closing = match?.[1] === '/'
    const selfClosing = !name || /\/\s*>$/.test(tag) || HTML_VOID.has(name)

    if (name && !closing && HTML_RAW.has(name) && !selfClosing) {
      const closePattern = new RegExp(`<\\/\\s*${name}\\s*>`, 'gi')
      closePattern.lastIndex = end + 1
      const close = closePattern.exec(source)
      if (!close) return null
      parts.push({ text: source.slice(i, close.index + close[0].length), name, raw: true })
      i = close.index + close[0].length
      continue
    }

    parts.push({ text: tag, name, closing, selfClosing })
    i = end + 1
  }
  return parts
}

/**
 * Dependency-free, conservative HTML pretty-printer. Inline runs stay together;
 * block elements get indentation, and whitespace-sensitive elements are opaque.
 */
function formatHtml(source: string, indent: number): string {
  if (lintHtml(source)) return source
  const parts = htmlParts(source)
  if (!parts) return source
  const unit = ' '.repeat(indent)
  const lines: string[] = []
  let depth = 0
  let inline = ''
  const flush = () => {
    const value = inline.trim()
    if (value) lines.push(unit.repeat(depth) + value)
    inline = ''
  }

  for (let index = 0; index < parts.length; index++) {
    const part = parts[index]
    const block = !!part.name && (HTML_BLOCK.has(part.name) || part.raw)
    if (!block) {
      if (/^\s+$/.test(part.text)) {
        if (inline && !inline.endsWith(' ')) inline += ' '
      } else inline += part.text
      continue
    }
    flush()
    if (part.closing) depth = Math.max(0, depth - 1)
    if (!part.closing && !part.selfClosing && !part.raw) {
      let content = ''
      let close = -1
      for (let next = index + 1; next < parts.length; next++) {
        const candidate = parts[next]
        if (candidate.closing && candidate.name === part.name) {
          close = next
          break
        }
        if (candidate.name && (HTML_BLOCK.has(candidate.name) || candidate.raw)) break
        content += candidate.text
      }
      const compact =
        part.text.trim() + content.trim() + (close >= 0 ? parts[close].text.trim() : '')
      if (close >= 0 && !compact.includes('\n') && compact.length <= 100) {
        lines.push(unit.repeat(depth) + compact)
        index = close
        continue
      }
    }
    // Keep raw-element contents byte-for-byte. In particular, indentation can
    // be data inside <pre>/<textarea> or a template literal inside <script>.
    lines.push(unit.repeat(depth) + part.text.trim())
    if (!part.closing && !part.selfClosing && !part.raw) depth++
  }
  flush()
  const formatted = lines.join('\n')
  return /[\r\n]$/.test(source) && formatted ? `${formatted}\n` : formatted
}

/** Pretty-prints supported formats. Invalid input and plain text come back as is. */
export function formatCode(language: CodeLanguage, source: string, indent = 2): string {
  if (language === 'json') {
    try {
      return JSON.stringify(JSON.parse(source), null, indent)
    } catch {
      return source
    }
  }
  if (language === 'html') return formatHtml(source, indent)
  if (language !== 'csv') return source
  const parsed = parseCsv(source)
  if (parsed.diagnostic) return source
  const formatted = parsed.rows.map((row) => row.map(quoteCsvField).join(',')).join('\n')
  return /[\r\n]$/.test(source) && formatted ? `${formatted}\n` : formatted
}

export const languageLabels: Record<CodeLanguage, string> = {
  json: 'JSON',
  yaml: 'YAML',
  csv: 'CSV',
  html: 'HTML',
  text: 'Plain text',
}

/**
 * Token colours, from the brand's own names so a `chat-theme-*` switch and
 * dark mode carry through. brand.css runs one hue plus the ember ramp, so the
 * palette is built from lightness as much as hue: keys are the brand blue,
 * strings use the contrast-checked warm `--syntax-string`, numbers and
 * literals a deeper step of the blue, structure recedes to --ink-soft. Syntax
 * deliberately does not borrow semantic status tokens such as `--caution`.
 *
 * Nothing here changes weight: the highlight layer has to keep the textarea's
 * glyph advances exactly, and a bold run in some monospace fallbacks does not.
 * Italic is safe — every monospace face keeps its advance when slanted.
 */
export const tokenClass: Record<CodeTokenKind, string> = {
  key: 'text-brand-fg',
  string: 'text-syntax-string',
  number: 'text-brand-700 dark:text-brand-200',
  literal: 'text-brand-700 italic dark:text-brand-200',
  punctuation: 'text-ink-soft',
  comment: 'text-ink-soft italic',
  invalid: 'text-danger-fg',
  plain: 'text-ink',
  space: '',
}
