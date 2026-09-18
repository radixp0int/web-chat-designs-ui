// The selected step as a full-width page, opened from the inspector's expand
// button and closed with Esc or its breadcrumb.
//
// Why it exists: the 400px panel stacks everything a gate carries into one
// narrow column, so the figures, the exception and the trace each arrive a
// scroll apart from the decision they inform. Here the same blocks (stepParts.tsx
// — the panel is their narrow arrangement, this is the wide one) sit in two
// columns, with the answer beside the evidence rather than below it.
//
// It covers the run's column, not the sidebar: what this run *is* and what else
// is waiting on you are still worth seeing while you decide.
import { useEffect } from 'react'
import { ChevronLeftIcon, XIcon } from '../../../lib/components/icons'
import { IconButton } from '../../../lib/components/icon-button'
import type { StepSeed, StepStatus } from '../canvas'
import type { Decision, RunDetail } from '../run/wireProtocol'
import { SectionLabel } from './SectionLabel'
import {
  DecisionForm,
  HowItGotHere,
  NextIfApproved,
  PolicyException,
  Recommendation,
  StepBadges,
  StepDetails,
} from './stepParts'

export function StepDetail({
  step,
  status,
  runTitle,
  next,
  decisions,
  busy,
  onClose,
  onDecide,
}: {
  step: StepSeed<RunDetail>
  status: StepStatus | undefined
  /** What the breadcrumb goes back to. */
  runTitle: string
  /** What runs after this one, nearest first. Only drawn on an open gate. */
  next: StepSeed<RunDetail>[]
  decisions: Decision[]
  busy: boolean
  onClose: () => void
  onDecide: (decision: Decision, note?: string) => void
}) {
  // Esc closes, so the expand is never a one-way door. Capture is not needed —
  // nothing underneath is listening — but the textarea is, so a note being typed
  // must not swallow the way out.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const { detail } = step
  const canDecide = status === 'waiting' && decisions.length > 0

  return (
    <div className="absolute inset-0 z-20 flex animate-fade-up flex-col bg-panel-solid">
      <div className="flex shrink-0 items-center gap-2.5 border-b border-line py-3 pr-3.5 pl-4">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[13px] font-semibold text-ink-soft transition hover:bg-tint/6 hover:text-ink-strong"
        >
          <ChevronLeftIcon width={16} height={16} />
          {runTitle}
        </button>
        <span className="flex-1" />
        <IconButton onClick={onClose} aria-label="Close full view" title="Close">
          <XIcon width={14} height={14} />
        </IconButton>
      </div>

      {/* @container, not a viewport query, for the reason RunTopBar spells out:
          this view lives in the run's column, which is ~690px on a 1024 screen
          once the sidebar has its 288. `lg:` fired there and squeezed the left
          column to 238px. */}
      <div className="@container min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-5xl flex-col gap-7 px-10 py-8">
          <div className="flex flex-col gap-2.5">
            <StepBadges step={step} status={status} />
            <h1 className="text-[28px] leading-9 font-bold tracking-tight text-ink-strong">
              {step.title}
            </h1>
            <p className="max-w-2xl text-sm leading-[22px] text-pretty text-ink-soft">
              {detail.summary}
            </p>
          </div>

          {/* One column until the run's column is genuinely wide: a squeezed
              two-column layout is worse than the panel's own arrangement, which
              is what this falls back to. */}
          <div className="grid gap-7 @4xl:grid-cols-[minmax(0,1fr)_340px] @4xl:items-start">
            <div className="flex min-w-0 flex-col gap-7">
              {detail.recommendation && <Recommendation rec={detail.recommendation} />}
              {detail.exception && <PolicyException exc={detail.exception} />}
              {detail.trace && <HowItGotHere trace={detail.trace} />}
            </div>

            <div className="flex flex-col gap-7">
              <StepDetails step={step} />

              {canDecide && (
                <div className="flex flex-col gap-2.5">
                  <SectionLabel>Your decision</SectionLabel>
                  <DecisionForm
                    key={step.id}
                    id="wf-note-detail"
                    decisions={decisions}
                    busy={busy}
                    onDecide={onDecide}
                  />
                </div>
              )}

              {canDecide && <NextIfApproved steps={next} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
