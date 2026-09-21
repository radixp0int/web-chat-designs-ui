import type { AskedOverScope, Message } from '../../types'

export type ChatMessageProps = {
  message: Message
  /** When provided, a finished answer's follow-up suggestions are offered.
   *  Callers opt out per message by omitting it — typically every message but
   *  the last, so branches don't stack up the thread. */
  onFollowup?: (text: string) => void
  /** When provided, a failed turn offers a Retry that re-runs it. */
  onRetry?: (id: number) => void
  /** Held while a turn is in flight, so a follow-up can't jump the send queue. */
  busy?: boolean
  /** Copy / regenerate / vote row under a finished answer, and the copy
   *  action under a question. Defaults to shown. */
  showActions?: boolean
  /**
   * The filters in force now differ from the ones this question was asked
   * under. The host computes it — the message carries a snapshot and must
   * never look at live state to find out what changed.
   */
  askedOverChanged?: boolean
  /** Offered on a changed record: put that scope back. */
  onRestoreScope?: (scope: AskedOverScope) => void
}
