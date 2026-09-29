import {
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { KeyboardEvent, SyntheticEvent } from 'react'
import { CheckIcon, SearchIcon } from '../../components/icons'
import { IconButton } from '../../components/icon-button'
import { EditorOptionsMenu } from '../editor-options'
import { FindReplaceBar } from '../find-replace'
import { findTextMatches, replaceAllText, splitSearchParts } from '../find-replace-model'
import { languageLabels, lintCode, tokenClass, tokenizeLine } from './languages'
import type { CodeEditorProps } from './types'

/**
 * The type metrics the textarea and the highlight layer share. They are one
 * string on purpose: the textarea's text is transparent and the coloured copy
 * underneath is what you read, so any difference in font, size, line height,
 * padding, tab size or ligatures slides the caret off the glyphs it sits in.
 */
const metrics = 'font-mono text-[13px] leading-5 [font-variant-ligatures:none] py-3 pr-8 pl-4'

/** Line height in px — `leading-5`. The gutter rows depend on it. */
const LINE = 20

/**
 * Inserts through the browser's own editing path so Cmd/Ctrl+Z still undoes
 * it. Setting `value` (or React state) directly wipes the textarea's undo
 * stack, which is the thing people notice first in a homemade editor.
 * `execCommand` is deprecated but has no replacement for this; where it
 * refuses, `setRangeText` plus a synthetic input event still reaches
 * React's onChange, just without undo.
 */
function insertText(ta: HTMLTextAreaElement, text: string) {
  ta.focus()
  if (!document.execCommand('insertText', false, text)) {
    ta.setRangeText(text, ta.selectionStart, ta.selectionEnd, 'end')
    ta.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

/**
 * A code editor for JSON, YAML, CSV, HTML and plain text — no editor library.
 *
 * A real `<textarea>` with transparent text lies exactly over a highlighted
 * copy of the same text. Typing, selection, the caret, IME, spellcheck-off,
 * copy and paste, undo and screen-reader support are all the browser's; this
 * component only draws colour underneath and handles four keys (Tab,
 * Shift+Tab, Enter, Escape). Both layers size to the content inside one
 * scroller, so they cannot drift apart while scrolling.
 *
 * Tab indents, which would trap keyboard users inside the field, so Escape
 * releases it: the next Tab moves focus on. The field's description says so.
 *
 * Every line renders. That is fine into the low thousands; past that it wants
 * windowing, which this does not do yet.
 */
export function CodeEditor({
  value: valueProp,
  defaultValue = '',
  onChange,
  language: languageProp,
  defaultLanguage = 'text',
  label,
  disabled = false,
  readOnly = false,
  validate = true,
  onDiagnosticChange,
  onInvalid,
  tabSize = 2,
  title,
  actions,
  options,
  lineNumbers = true,
  statusBar = true,
  className = '',
  id,
  ref,
}: CodeEditorProps) {
  const auto = useId()
  const fieldId = id ?? `${auto}-code`
  const helpId = `${fieldId}-help`
  const problemId = `${fieldId}-problem`
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  const [initialLanguage] = useState(defaultLanguage)
  const controlled = valueProp !== undefined
  const value = valueProp ?? uncontrolledValue
  const language = languageProp ?? initialLanguage
  // A controlled value without an update handler remains a convenient
  // read-only viewer. An uncontrolled editor owns its updates itself.
  const locked = disabled || readOnly || (controlled && !onChange)

  const [caret, setCaret] = useState({ line: 1, column: 1 })
  const [focused, setFocused] = useState(false)
  const [released, setReleased] = useState(false)
  const [validationAttempt, setValidationAttempt] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const highlightedRef = useRef<HTMLDivElement>(null)
  const findInputRef = useRef<HTMLInputElement>(null)
  const replacementInputRef = useRef<HTMLInputElement>(null)
  const findReturnRef = useRef<HTMLElement | null>(null)
  const [findOpen, setFindOpen] = useState(false)
  const [replaceOpen, setReplaceOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [replacement, setReplacement] = useState('')
  const [currentMatch, setCurrentMatch] = useState(0)
  const [wordWrap, setWordWrap] = useState(options?.wordWrap === 'on')
  const [showLineNumbers, setShowLineNumbers] = useState(
    options?.lineNumbers === undefined ? lineNumbers : options.lineNumbers === 'on',
  )
  const [showStatusBar, setShowStatusBar] = useState(
    options?.statusBar === undefined
      ? statusBar
      : options.statusBar === true || options.statusBar === 'on',
  )
  const [lineHeights, setLineHeights] = useState<number[]>([])

  useEffect(() => {
    if (options?.wordWrap !== undefined) setWordWrap(options.wordWrap === 'on')
  }, [options?.wordWrap])
  useEffect(() => {
    setShowLineNumbers(
      options?.lineNumbers === undefined ? lineNumbers : options.lineNumbers === 'on',
    )
  }, [lineNumbers, options?.lineNumbers])
  useEffect(() => {
    setShowStatusBar(
      options?.statusBar === undefined
        ? statusBar
        : options.statusBar === true || options.statusBar === 'on',
    )
  }, [statusBar, options?.statusBar])

  const diagnostic = useMemo(() => {
    if (validate === false) return null
    if (typeof validate === 'function') return validate(value)
    return lintCode(language, value)
  }, [validate, language, value])

  useEffect(() => {
    onDiagnosticChange?.(diagnostic)
  }, [diagnostic, onDiagnosticChange])

  useImperativeHandle(
    ref,
    () => ({
      checkValid() {
        if (!diagnostic) return true
        textareaRef.current?.focus()
        setValidationAttempt((attempt) => attempt + 1)
        onInvalid?.(diagnostic)
        return false
      },
      focus() {
        textareaRef.current?.focus()
      },
    }),
    [diagnostic, onInvalid],
  )

  const lines = useMemo(
    () => value.split('\n').map((text) => ({ text, tokens: tokenizeLine(language, text) })),
    [value, language],
  )
  const lineStarts = useMemo(() => {
    let offset = 0
    return lines.map((line) => {
      const start = offset
      offset += line.text.length + 1
      return start
    })
  }, [lines])
  const searchMatches = useMemo(() => findTextMatches(value, query), [value, query])
  const activeMatch = searchMatches[Math.min(currentMatch, Math.max(0, searchMatches.length - 1))]

  useEffect(() => {
    setCurrentMatch((current) => Math.min(current, Math.max(0, searchMatches.length - 1)))
  }, [searchMatches.length])
  useEffect(() => {
    if (findOpen) (replaceOpen ? replacementInputRef : findInputRef).current?.focus()
  }, [findOpen, replaceOpen])
  useEffect(() => {
    if (!activeMatch) return
    highlightedRef.current
      ?.querySelector<HTMLElement>('[data-current-search="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [activeMatch, wordWrap])

  const updateValue = (next: string) => {
    if (!controlled) setUncontrolledValue(next)
    onChange?.(next)
  }
  const stepFind = (delta: number) => {
    if (!searchMatches.length) return
    setCurrentMatch(
      (current) =>
        (Math.min(current, searchMatches.length - 1) + delta + searchMatches.length) %
        searchMatches.length,
    )
  }
  const replaceCurrent = () => {
    if (locked || !activeMatch) return
    updateValue(value.slice(0, activeMatch.start) + replacement + value.slice(activeMatch.end))
    if (replacement.toLocaleLowerCase() === query.toLocaleLowerCase()) stepFind(1)
  }
  const replaceAll = () => {
    if (!locked && searchMatches.length)
      updateValue(replaceAllText(value, searchMatches, replacement))
  }
  const openFind = (replace = false) => {
    if (disabled) return
    if (!findOpen) findReturnRef.current = document.activeElement as HTMLElement | null
    setFindOpen(true)
    if (replace && !locked) setReplaceOpen(true)
  }
  const closeFind = () => {
    setFindOpen(false)
    requestAnimationFrame(() => findReturnRef.current?.focus())
  }
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

  useLayoutEffect(() => {
    if (!wordWrap) {
      setLineHeights([])
      return
    }
    const highlighted = highlightedRef.current
    if (!highlighted) return
    const measure = () => {
      const next = Array.from(highlighted.children, (line) =>
        Math.max(LINE, (line as HTMLElement).offsetHeight),
      )
      setLineHeights((current) =>
        current.length === next.length && current.every((height, index) => height === next[index])
          ? current
          : next,
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(highlighted)
    for (const line of highlighted.children) observer.observe(line)
    return () => observer.disconnect()
  }, [lines, showLineNumbers, wordWrap])

  const trackCaret = (e: SyntheticEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget
    const before = ta.value.slice(0, ta.selectionStart)
    const line = before.split('\n').length
    const column = ta.selectionStart - before.lastIndexOf('\n')
    setCaret((c) => (c.line === line && c.column === column ? c : { line, column }))
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (locked) return
    const ta = e.currentTarget
    const { selectionStart: s, selectionEnd: end, value: v } = ta
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
        insertText(ta, unit)
        return
      }
      // Indent or outdent every line the selection touches. A selection that
      // ends at the very start of a line does not include that line.
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
      ta.setSelectionRange(lineStart, blockEnd)
      insertText(ta, next)
      if (multiLine) ta.setSelectionRange(lineStart, lineStart + next.length)
      else {
        const at = Math.max(lineStart, s - firstRemoved)
        ta.setSelectionRange(at, at)
      }
      return
    }
    setReleased(false)

    if (
      e.key === 'Enter' &&
      !e.shiftKey &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.nativeEvent.isComposing
    ) {
      // Keep the current indent, one step deeper after an opener. In YAML a
      // `key:` opens a block and a list item continues the list.
      const current = v.slice(v.lastIndexOf('\n', s - 1) + 1, s)
      let indent = current.match(/^ */)![0]
      if (/[{[]\s*$/.test(current)) indent += unit
      else if (language === 'yaml' && /:\s*$/.test(current)) indent += unit
      else if (language === 'yaml' && /^ *- \S/.test(current)) indent += '- '
      else if (
        language === 'html' &&
        /<(?!\/|!|\?)(?!(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)\b)[a-z][^>]*>\s*$/i.test(
          current,
        )
      )
        indent += unit
      if (!indent) return
      e.preventDefault()
      insertText(ta, `\n${indent}`)
    }
  }

  const guidesOn = language === 'json' || language === 'yaml'
  return (
    <div
      aria-disabled={disabled || undefined}
      onKeyDownCapture={onShortcut}
      className={[
        'flex min-h-0 flex-col overflow-hidden rounded-surface border bg-panel-solid transition',
        diagnostic
          ? 'border-danger has-[textarea:focus-visible]:ring-3 has-[textarea:focus-visible]:ring-danger/15'
          : 'border-line has-[textarea:focus-visible]:border-accent has-[textarea:focus-visible]:ring-3 has-[textarea:focus-visible]:ring-accent/20',
        disabled ? 'bg-tint/5' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex min-h-11 shrink-0 items-center gap-2 border-b border-line py-1.5 pr-1.5 pl-4">
        <div className="flex min-w-0 grow items-center gap-2 text-[13px] font-bold text-ink-strong">
          {title}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
        <IconButton
          size="sm"
          shape="rounded"
          aria-label="Find in editor"
          title="Find"
          disabled={disabled}
          onClick={() => openFind()}
        >
          <SearchIcon width={15} height={15} />
        </IconButton>
        <EditorOptionsMenu
          disabled={disabled}
          options={[
            { label: 'Word wrap', checked: wordWrap, onChange: setWordWrap },
            {
              label: 'Line numbers',
              checked: showLineNumbers,
              onChange: setShowLineNumbers,
            },
            { label: 'Status bar', checked: showStatusBar, onChange: setShowStatusBar },
          ]}
        />
      </div>

      {findOpen && (
        <FindReplaceBar
          query={query}
          replacement={replacement}
          replaceOpen={replaceOpen}
          replaceAvailable={!locked}
          current={Math.min(currentMatch, Math.max(0, searchMatches.length - 1))}
          total={searchMatches.length}
          canReplaceCurrent={!locked && !!activeMatch}
          canReplaceAll={!locked && !!searchMatches.length}
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

      <div className={`min-h-0 grow ${wordWrap ? 'overflow-y-auto' : 'overflow-auto'}`}>
        <div className={`flex min-h-full min-w-full ${wordWrap ? '' : 'w-max'}`}>
          {showLineNumbers && (
            <div
              aria-hidden="true"
              className="sticky left-0 z-10 shrink-0 bg-panel-solid py-3 font-mono text-[12px] leading-5 tabular-nums select-none"
            >
              {lines.map((_, i) => {
                const n = i + 1
                const isError = diagnostic?.line === n
                const isActive = focused && caret.line === n
                return (
                  <div
                    key={n}
                    style={{ height: wordWrap ? (lineHeights[i] ?? LINE) : LINE }}
                    className={[
                      'flex items-center justify-end gap-1.5 pr-3 pl-3',
                      isError ? 'text-danger-fg' : isActive ? 'text-ink-strong' : 'text-ink-soft',
                    ].join(' ')}
                  >
                    <span
                      className={`size-1.5 rounded-full ${isError ? 'bg-danger-fg' : 'bg-transparent'}`}
                    />
                    {n}
                  </div>
                )
              })}
            </div>
          )}

          <div className="relative min-w-0 grow">
            <div
              ref={highlightedRef}
              aria-hidden="true"
              className={`${metrics} ${wordWrap ? 'whitespace-pre-wrap [overflow-wrap:anywhere]' : 'whitespace-pre'}`}
              style={{ tabSize }}
            >
              {lines.map((line, i) => {
                const n = i + 1
                const isError = diagnostic?.line === n
                const isActive = focused && caret.line === n
                const depth = guidesOn ? Math.floor(line.text.match(/^ */)![0].length / tabSize) : 0

                // The token the diagnostic points into — or, past the end of
                // the line, the last thing on it — gets the squiggle.
                let squiggle = -1
                if (isError) {
                  let pos = 0
                  let last = -1
                  for (let k = 0; k < line.tokens.length; k++) {
                    const t = line.tokens[k]
                    pos += t.text.length
                    if (t.kind === 'space') continue
                    last = k
                    if (diagnostic.column - 1 < pos) {
                      squiggle = k
                      break
                    }
                  }
                  if (squiggle < 0) squiggle = last
                }

                return (
                  <div
                    key={i}
                    style={{
                      minHeight: LINE,
                      height: wordWrap ? undefined : LINE,
                      // Indent guides: one hairline per indent step, spaced in
                      // `ch` so they land on the columns whatever the font.
                      backgroundImage: depth
                        ? `repeating-linear-gradient(to right, var(--line) 0 1px, transparent 1px ${tabSize}ch)`
                        : undefined,
                      backgroundSize: depth ? `${depth * tabSize}ch 100%` : undefined,
                      backgroundPosition: '1rem 0',
                      backgroundRepeat: 'no-repeat',
                    }}
                    className={isError ? 'bg-danger/8' : isActive ? 'bg-tint/5' : undefined}
                  >
                    {splitSearchParts(line.tokens, query).map((part, k) => {
                      const match = part.matchStart !== null
                      const current =
                        match && activeMatch?.start === lineStarts[i] + part.matchStart!
                      const contents = (
                        <span
                          className={[
                            tokenClass[part.source.kind],
                            line.tokens.indexOf(part.source) === squiggle
                              ? 'underline decoration-danger-fg decoration-wavy underline-offset-4'
                              : '',
                          ].join(' ')}
                        >
                          {part.text}
                        </span>
                      )
                      return match ? (
                        <mark
                          key={k}
                          data-current-search={current || undefined}
                          className={`rounded-[2px] text-inherit ${current ? 'bg-brand-solid/35 ring-1 ring-brand-fg' : 'bg-caution/35'}`}
                        >
                          {contents}
                        </mark>
                      ) : (
                        <span key={k}>{contents}</span>
                      )
                    })}
                  </div>
                )
              })}
            </div>

            <textarea
              ref={textareaRef}
              id={fieldId}
              value={value}
              onChange={(e) => {
                const next = e.target.value
                updateValue(next)
                trackCaret(e)
              }}
              onKeyDown={onKeyDown}
              onSelect={trackCaret}
              onFocus={() => setFocused(true)}
              onBlur={() => {
                setFocused(false)
                setReleased(false)
              }}
              readOnly={locked}
              disabled={disabled}
              aria-label={label}
              aria-describedby={diagnostic ? `${helpId} ${problemId}` : helpId}
              aria-invalid={diagnostic ? true : undefined}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              wrap={wordWrap ? 'soft' : 'off'}
              style={{ tabSize }}
              className={`${metrics} absolute inset-0 size-full resize-none overflow-hidden border-0 bg-transparent text-transparent caret-ink-strong outline-none ${wordWrap ? 'whitespace-pre-wrap [overflow-wrap:anywhere]' : 'whitespace-pre'}`}
            />
          </div>
        </div>
      </div>

      {showStatusBar && (
        <div className="flex h-8 shrink-0 items-center gap-4 border-t border-line px-4 text-[12px] text-ink-soft">
          <div className="flex min-w-0 grow items-center gap-1.5">
            {diagnostic ? (
              <span id={problemId} className="truncate text-danger-fg">
                <span className="font-bold">
                  Ln {diagnostic.line}, Col {diagnostic.column}
                </span>{' '}
                — {diagnostic.message}
              </span>
            ) : (
              validate !== false &&
              language !== 'text' && (
                <>
                  <CheckIcon width={13} height={13} className="shrink-0 text-brand-fg" />
                  <span className="truncate">No problems</span>
                </>
              )
            )}
          </div>
          <span className="shrink-0 tabular-nums">
            Ln {caret.line}, Col {caret.column}
          </span>
          <span className="shrink-0 max-sm:hidden">Spaces: {tabSize}</span>
          <span className="shrink-0 font-bold text-ink">{languageLabels[language]}</span>
        </div>
      )}

      {!showStatusBar && diagnostic && (
        <span id={problemId} className="sr-only">
          Line {diagnostic.line}, column {diagnostic.column}: {diagnostic.message}
        </span>
      )}

      {validationAttempt > 0 && diagnostic && (
        <span key={validationAttempt} role="alert" className="sr-only">
          Code is invalid. Line {diagnostic.line}, column {diagnostic.column}: {diagnostic.message}
        </span>
      )}

      <span id={helpId} className="sr-only">
        {disabled
          ? `${languageLabels[language]}, disabled.`
          : locked
            ? `${languageLabels[language]}, read only.`
            : `${languageLabels[language]}. Tab indents. Press Escape, then Tab, to leave the editor.`}
      </span>
      {/* No live region for the diagnostic: half-typed JSON is invalid after
          nearly every keystroke, and announcing each one would drown the
          typing. It is reachable through aria-invalid and the description. */}
    </div>
  )
}
