import type { ReactNode } from 'react'
import type { CodeLanguage } from '../code-editor'

export type DiffView = 'split' | 'unified'

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
  /** On the outer box. Give it a height; the diff scrolls inside it. */
  className?: string
}
