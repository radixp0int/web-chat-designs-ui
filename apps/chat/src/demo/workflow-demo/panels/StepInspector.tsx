// Right panel: the selected step in full, and — for a step that is waiting on a
// person — the decision itself. Compact nodes plus this panel is the trade the
// "Normal view" makes: the canvas stays scannable, the detail lives here.
//
// The step arrives as a prop rather than being looked up by id, so this panel
// works for any run, hard-coded or streamed.
//
// The blocks it stacks are shared with StepDetail — see stepParts.tsx. This file
// is the narrow arrangement of them; that one is the wide arrangement.
import { ExpandDiagonalIcon, IconButton } from '@chat/ui'
import type { StepSeed, StepStatus } from '../canvas'
import type { Decision, RunDetail } from '../run/wireProtocol'
import { PanelShell } from './PanelShell'
import {
  DecisionForm,
  HowItGotHere,
  PolicyException,
  Recommendation,
  StepBadges,
  StepDetails,
} from './stepParts'

export function StepInspector({
  step,
  status,
  decisions,
  busy,
  onClose,
  onExpand,
  onDecide,
}: {
  step: StepSeed<RunDetail> | null
  status: StepStatus | undefined
  /** Which buttons this gate allows. Empty hides the footer entirely. */
  decisions: Decision[]
  /** A decision is in flight — the server hasn't answered yet. */
  busy: boolean
  onClose: () => void
  /** Opens the same step as a full-width page. Omitted when there is no step. */
  onExpand: () => void
  onDecide: (decision: Decision, note?: string) => void
}) {
  if (!step) {
    return (
      <PanelShell title="Step details" onClose={onClose}>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
          <span className="orb block size-8 rounded-full opacity-40" aria-hidden />
          <p className="text-[13px] leading-5 text-ink-soft">
            Select a step on the canvas to see what it produced and what it is waiting on.
          </p>
        </div>
      </PanelShell>
    )
  }

  const { detail } = step
  const canDecide = status === 'waiting' && decisions.length > 0

  return (
    <PanelShell
      title="Step details"
      onClose={onClose}
      /* Expanding is navigation, not a decision, so it belongs up here with the
         other navigation control rather than in the footer — where a fourth
         button beside Approve would read as a fourth answer. The header does not
         scroll either, so it stays reachable in a long step. */
      actions={
        <IconButton onClick={onExpand} aria-label="Open full view" title="Open full view">
          <ExpandDiagonalIcon width={14} height={14} />
        </IconButton>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
        <div className="flex flex-col gap-2.5">
          <StepBadges step={step} status={status} />
          <h2 className="text-[19px] leading-[26px] font-bold tracking-tight text-ink-strong">
            {step.title}
          </h2>
          <p className="text-[13px] leading-[21px] text-pretty text-ink-soft">{detail.summary}</p>
        </div>

        <StepDetails step={step} />
        {detail.recommendation && <Recommendation rec={detail.recommendation} />}
        {detail.exception && <PolicyException exc={detail.exception} />}
        {detail.trace && <HowItGotHere trace={detail.trace} />}
      </div>

      {canDecide && (
        <div className="border-t border-line px-6 pt-4.5 pb-5">
          <DecisionForm
            key={step.id}
            id="wf-note-panel"
            decisions={decisions}
            busy={busy}
            onDecide={onDecide}
          />
        </div>
      )}
    </PanelShell>
  )
}
