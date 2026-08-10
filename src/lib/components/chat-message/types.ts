import type { Message } from '../../types'

export type ChatMessageProps = {
  message: Message
  /** When provided, queued user messages get a remove-from-queue control. */
  onRemoveQueued?: (id: number) => void
  /** When provided, a finished answer's follow-up suggestions are offered.
   *  Callers opt out per message by omitting it — typically every message but
   *  the last, so branches don't stack up the thread. */
  onFollowup?: (text: string) => void
  /** Held while a turn is in flight, so a follow-up can't jump the send queue. */
  busy?: boolean
  /** Copy / regenerate / vote row under a finished answer. Defaults to shown. */
  showActions?: boolean
}
