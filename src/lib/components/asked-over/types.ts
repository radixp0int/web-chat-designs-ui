import type { AskedOverScope } from '../../types'

export type AskedOverStripProps = {
  scope: AskedOverScope
  /**
   * The filters in force now differ from this record. Computed by the host,
   * which is the only part of the app that knows what "now" is — the strip
   * itself must never look.
   */
  changed?: boolean
  /** Offered only when `changed`. Puts the recorded scope back on the rail. */
  onRestore?: () => void
  /** Fewer labels in the collapsed line. Everything else is unchanged. */
  density?: 'comfortable' | 'compact'
  className?: string
}
