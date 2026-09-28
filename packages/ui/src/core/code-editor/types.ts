import type { ReactNode, Ref } from 'react'

export type CodeLanguage = 'json' | 'yaml' | 'csv' | 'text'

export type CodeTokenKind =
  | 'key'
  | 'string'
  | 'number'
  | 'literal'
  | 'punctuation'
  | 'comment'
  | 'invalid'
  | 'plain'
  | 'space'

export type CodeToken = { kind: CodeTokenKind; text: string }

/** One problem, 1-based like every editor's status bar. */
export type CodeDiagnostic = {
  line: number
  column: number
  message: string
}

export type CodeEditorHandle = {
  /** Validate the latest controlled value and focus the editor when it is invalid. */
  checkValid: () => boolean
  focus: () => void
}

export type CodeEditorProps = {
  /** Controlled text, matching Monaco's editor contract. */
  value?: string
  /** Initial text for an uncontrolled editor. Ignored when `value` is provided. */
  defaultValue?: string
  /** Called after an edit in either controlled or uncontrolled mode. */
  onChange?: (value: string) => void
  /** Controlled language. */
  language?: CodeLanguage
  /** Initial language used when `language` is not provided. */
  defaultLanguage?: CodeLanguage
  /** The textarea's accessible name. Required — see `Select`. */
  label: string
  /** Prevents focus and editing while preserving the rendered code. */
  disabled?: boolean
  readOnly?: boolean
  /**
   * `true` (the default) runs the built-in check for the language: JSON.parse
   * for JSON, tabs and unclosed quotes for YAML, CSV quoting rules, and nothing
   * for plain text.
   * Pass a function to replace it, `false` to turn it off.
   */
  validate?: boolean | ((value: string) => CodeDiagnostic | null)
  /** Called whenever the diagnostic changes, so a form can block a save. */
  onDiagnosticChange?: (diagnostic: CodeDiagnostic | null) => void
  /** Called only when an explicit `ref.checkValid()` attempt fails. */
  onInvalid?: (diagnostic: CodeDiagnostic) => void
  /** Spaces per indent step — what Tab inserts and what the guides are spaced by. */
  tabSize?: number
  /** Header content on the left — usually a file name. No header without it or `actions`. */
  title?: ReactNode
  /** Header content on the right — Format, Copy. */
  actions?: ReactNode
  lineNumbers?: boolean
  statusBar?: boolean
  /** On the outer box. Give it a height; the code scrolls inside it. */
  className?: string
  id?: string
  ref?: Ref<CodeEditorHandle>
}
