import type { Persona } from '../../types'

export type PersonaMenuProps = {
  personas: Persona[]
  persona: string
  onChange: (id: string) => void
  /** Compact renders an icon-only trigger — the label doesn't fit the widget row. */
  compact: boolean
}
