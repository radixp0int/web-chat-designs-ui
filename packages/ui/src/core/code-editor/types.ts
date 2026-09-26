import type { ReactNode, Ref } from 'react'

export type CodeLanguage = 'json' | 'yaml' | 'text'

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
  value: string
  /** Omit for a read-only viewer. */
  onChange?: (value: string) => void
  language?: CodeLanguage
  /** The textarea's accessible name. Required — see `Select`. */
  label: string
  readOnly?: boolean
  /**
   * `true` (the default) runs the built-in check for the language: JSON.parse
   * for JSON, tabs and unclosed quotes for YAML, nothing for plain text.
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
