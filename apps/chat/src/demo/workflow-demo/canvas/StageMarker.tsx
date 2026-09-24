// The one marker that says where a stage stands. Used by the column headers, the
// compact view's group headers and the left panel, so the three can't drift.
import { CheckIcon } from '../../../lib/components/icons'
import type { StageStatus } from './types'

export function StageMarker({ status, size = 18 }: { status: StageStatus; size?: number }) {
  if (status === 'done') {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-full bg-chip"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <CheckIcon width={11} height={11} strokeWidth={2.6} className="text-chip-fg" />
      </span>
    )
  }
  if (status === 'current') {
    return (
      <span
        className="grid shrink-0 place-items-center rounded-full border-2 border-notify bg-panel-solid"
        style={{ width: size, height: size }}
        aria-hidden
      >
        <span className="size-1.5 rounded-full bg-notify" />
      </span>
    )
  }
  return (
    <span
      className="block shrink-0 rounded-full border-[1.5px] border-dashed border-ink-soft/60 bg-panel-solid"
      style={{ width: size, height: size }}
      aria-hidden
    />
  )
}
