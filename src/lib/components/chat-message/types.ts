import type { Message } from '../../types'

export type ChatMessageProps = {
  message: Message
  /** When provided, queued user messages get a remove-from-queue control. */
  onRemoveQueued?: (id: number) => void
}
