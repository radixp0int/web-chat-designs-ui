// What state a step is in, as a marker plus an optional word.
//
// The words are the caller's: a status NAME ("Queued") is kit vocabulary and has
// a default here, but anything situational — a countdown, an SLA — comes in as
// `text`, because a node component has no business knowing one run's deadlines.
import { CheckIcon, XIcon } from '../../../lib/components/icons'
import { SkipIcon } from './icons'
import type { StepStatus } from './types'
import type { ZoomTier } from './zoom'

/** Words at the detail tier, a bare marker below it. */
export function StatusMark({
  status,
  text,
  tier = 'detail',
}: {
  status: StepStatus
  text?: string
  tier?: ZoomTier
}) {
  const bare = tier !== 'detail'
  const scale = tier === 'glyph' ? 1.35 : 1
  const label = (cls: string) =>
    !bare && text ? <span className={`text-[11px] tabular-nums ${cls}`}>{text}</span> : null

  switch (status) {
    case 'done':
    case 'approved':
      return (
        <span className="ml-auto flex items-center gap-1.5">
          <CheckIcon width={14 * scale} height={14 * scale} className="text-accent" />
          {label('font-medium text-ink-soft')}
        </span>
      )
    case 'running':
      return (
        <span className="ml-auto flex items-center gap-1.5">
          <span
            className="animate-pulse rounded-full bg-accent"
            style={{ width: 7 * scale, height: 7 * scale }}
            aria-hidden
          />
          {!bare && (
            <span className="shimmer-text text-[11px] font-semibold">{text ?? 'Running'}</span>
          )}
        </span>
      )
    case 'waiting':
      return (
        <span className="ml-auto flex items-center gap-1.5">
          <span
            className="rounded-full bg-notify"
            style={{ width: 8 * scale, height: 8 * scale }}
            aria-hidden
          />
          {label('font-bold text-ink-strong')}
        </span>
      )
    case 'failed':
      return (
        <span className="ml-auto flex items-center gap-1.5">
          <XIcon width={13 * scale} height={13 * scale} className="text-danger-fg-soft" />
          {label('font-semibold text-danger-fg-soft')}
        </span>
      )
    case 'skipped':
      return (
        <span className="ml-auto flex items-center gap-1.5">
          <SkipIcon width={12 * scale} height={12 * scale} className="text-ink-soft" />
          {label('text-ink-soft')}
        </span>
      )
    case 'changes':
      return (
        <span className="ml-auto flex items-center gap-1.5">
          <SkipIcon width={12 * scale} height={12 * scale} className="text-ink" />
          {label('font-semibold text-ink')}
        </span>
      )
    default:
      return <span className="ml-auto">{label('text-ink-soft')}</span>
  }
}
