import type { ReactNode } from 'react'
import type { CodeLanguage } from '../code-editor'

export type DiffView = 'split' | 'unified'

/** Which sides take typing: neither, one, or both. */
export type DiffEditable = 'none' | 'original' | 'modified' | 'both'

export type DiffViewerProps = {
  original: string
  modified: string
  /** Colours both sides with the editor's tokenizer. */
  language?: CodeLanguage
  /** Header content on the left — usually the file name. */
  title?: ReactNode
  originalLabel?: string
  modifiedLabel?: string
  /** Controlled layout. Leave unset and pass `defaultView` to let the toolbar own it. */
  view?: DiffView
  defaultView?: DiffView
  onViewChange?: (view: DiffView) => void
  /** Collapse long unchanged runs to a "Show N unchanged lines" row. */
  defaultHideUnchanged?: boolean
  /** Unchanged lines kept visible either side of a change when collapsing. */
  context?: number
  /** Hides the layout switch, the collapse switch and change navigation. */
  hideControls?: boolean
  /**
   * Which sides can be typed in — `'none'` (the default), `'original'`,
   * `'modified'` or `'both'`. A side also needs its change handler; without
   * one it stays read-only. Any editable side turns wrapping and "Hide
   * unchanged" off. Unified view edits one side: the modified one, unless
   * only the original is editable.
   */
  editable?: DiffEditable
  onOriginalChange?: (value: string) => void
  onModifiedChange?: (value: string) => void
  /**
   * Each shows a copy button on that side's label, and is called with the
   * text that was copied — the side as it is now, edits included.
   */
  onCopyOriginal?: (value: string) => void
  onCopyModified?: (value: string) => void
  /** Spaces per indent step in an editable side. */
  tabSize?: number
  /** On the outer box. Give it a height; the diff scrolls inside it. */
  className?: string
}
