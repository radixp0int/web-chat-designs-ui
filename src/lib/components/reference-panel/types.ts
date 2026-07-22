import type { Highlight, Source } from '../../types'

export type ReferencePanelProps = {
  sources: Source[]
  activeId: number
  onSelect: (id: number) => void
  onClose: () => void
  /** Supporting passages to highlight, keyed by source id (referenceNumber). */
  highlights?: Highlight[]
  /** When set (mobile widget slide-over), the close control becomes a back button. */
  backLabel?: string
}
