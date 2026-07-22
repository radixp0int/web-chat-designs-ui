import type { Persona } from '../../types'

export type ComposerProps = {
  docked: boolean
  disabled?: boolean
  /** A response is streaming: the send button becomes a stop button, and
   *  submits queue (Enter) or steer (Cmd/Ctrl+Enter) instead of sending. */
  streaming?: boolean
  onStop?: () => void
  onSubmit: (text: string, opts?: { steer?: boolean }) => void
  personas: Persona[]
  persona: string
  onPersonaChange: (id: string) => void
}
