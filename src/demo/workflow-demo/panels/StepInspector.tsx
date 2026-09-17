// Right panel: the selected step in full, and — for a step that is waiting on a
// person — the decision itself. Compact nodes plus this panel is the trade the
// "Normal view" makes: the canvas stays scannable, the detail lives here.
//
// The step arrives as a prop rather than being looked up by id, so this panel
// works for any run, hard-coded or streamed.
import { useEffect, useState } from 'react'
import { FlagIcon } from '../canvas/icons'
import { KindIcon } from '../canvas'
import type { StepSeed, StepStatus } from '../canvas'
import type { Decision, RunDetail } from '../run/wireProtocol'
import { PanelShell } from './PanelShell'
import { SectionLabel } from './SectionLabel'

const KIND_LABEL = {
  agent: 'Agent',
  human: 'Approval',
  tool: 'System call',
  decision: 'Decision',
  trigger: 'Trigger',
} as const

const STATUS_LABEL: Record<StepStatus, string> = {
  done: 'Done',
  running: 'Running',
  waiting: 'Needs approval',
  queued: 'Queued',
  skipped: 'Skipped',
  failed: 'Failed',
  approved: 'Approved',
  changes: 'Sent back',
}

/* The three things a gate can be answered with. A gate offers a subset — an
   incident is yes or no, a credit memo can also be sent back — so each button is
   declared once here rather than written out three times at the call site.
   Weight lives per-decision: two Tailwind font utilities on one element resolve
   by stylesheet order, not by the order they appear in the string. */
const BUTTON_BASE = 'h-9 rounded-lg text-[13px] transition disabled:opacity-50'

const DECISION_BUTTON: Record<Decision, { label: string; className: string }> = {
  declined: { label: 'Decline', className: 'px-2.5 font-semibold text-danger-fg hover:bg-tint/8' },
  changes: {
    label: 'Request changes',
    className: 'border border-line bg-panel-solid px-3.5 font-semibold text-ink hover:bg-tint/6',
  },
  approved: {
    label: 'Approve',
    className: 'bg-accent px-4.5 font-bold text-on-accent hover:bg-accent-hover',
  },
}

/** Answers that move the run forward, in the order they are offered. */
const AFFIRMATIVE = ['changes', 'approved'] as const

export function StepInspector({
  step,
  status,
  decisions,
  busy,
  onClose,
  onDecide,
}: {
  step: StepSeed<RunDetail> | null
  status: StepStatus | undefined
  /** Which buttons this gate allows. Empty hides the footer entirely. */
  decisions: Decision[]
  /** A decision is in flight — the server hasn't answered yet. */
  busy: boolean
  onClose: () => void
  onDecide: (decision: Decision, note?: string) => void
}) {
  const [note, setNote] = useState('')

  // The note belongs to the decision in front of you, not to the panel.
  useEffect(() => setNote(''), [step?.id])

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
  const waiting = status === 'waiting'
  const canDecide = waiting && decisions.length > 0
  const decide = (decision: Decision) => onDecide(decision, note.trim() || undefined)

  return (
    <PanelShell title="Step details" onClose={onClose}>
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-5 items-center gap-1.5 rounded-md bg-chip px-2 text-[11px] font-bold text-chip-fg">
              <KindIcon kind={step.kind} initials={step.initials} size={14} />
              {KIND_LABEL[step.kind]}
            </span>
            {waiting ? (
              <span className="ml-auto inline-flex h-5 items-center rounded-full bg-notify px-2 text-[11px] font-bold text-on-notify">
                Needs approval
              </span>
            ) : (
              status && (
                <span className="ml-auto text-xs font-semibold text-ink-soft">
                  {STATUS_LABEL[status]}
                </span>
              )
            )}
          </div>
          <h2 className="text-[19px] leading-[26px] font-bold tracking-tight text-ink-strong">
            {step.title}
          </h2>
          <p className="text-[13px] leading-[21px] text-pretty text-ink-soft">{detail.summary}</p>
        </div>

        <dl className="grid grid-cols-[92px_minmax(0,1fr)] gap-x-3.5 gap-y-2">
          {detail.rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-[12.5px] leading-[22px] text-ink-soft">{k}</dt>
              <dd className="text-[13px] leading-[22px] font-medium text-ink-strong">{v}</dd>
            </div>
          ))}
        </dl>

        {detail.recommendation && (
          <div className="flex flex-col gap-2.5">
            <SectionLabel>{detail.recommendation.label ?? 'Agent recommendation'}</SectionLabel>
            <div className="rounded-lg bg-panel-solid p-4 ring-1 ring-line">
              <div className="flex items-center gap-2.5">
                <KindIcon kind="agent" size={16} />
                <span className="text-xs text-ink-soft">{detail.recommendation.from}</span>
              </div>
              <p className="mt-3 text-[15px] leading-5 font-bold text-ink-strong">
                {detail.recommendation.verdict}
              </p>
              <div className="mt-3 grid grid-cols-3 gap-2.5 border-t border-line pt-3">
                {detail.recommendation.figures.map(([k, v]) => (
                  <div key={k} className="flex flex-col">
                    <span className="text-[11px] text-ink-soft">{k}</span>
                    <span className="text-sm font-bold text-ink-strong tabular-nums">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {detail.exception && (
          <div className="flex flex-col gap-2.5">
            <SectionLabel>{detail.exception.label ?? 'Policy exception'}</SectionLabel>
            <div className="flex gap-2.5">
              <FlagIcon width={16} height={16} className="mt-0.5 shrink-0 text-ink-soft" />
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] leading-5 text-ink">{detail.exception.text}</span>
                <span className="text-xs leading-[18px] text-ink-soft">
                  {detail.exception.mitigant}
                </span>
              </div>
            </div>
          </div>
        )}

        {detail.trace && (
          <div className="flex flex-col gap-2.5">
            <SectionLabel>How it got here</SectionLabel>
            <ol className="turn-rail flex flex-col gap-1.5 pl-4 text-xs leading-4 text-ink-soft">
              {detail.trace.map(([at, label, ms]) => (
                <li key={`${at}-${label}`} className="flex items-baseline gap-3">
                  <span className="w-9 shrink-0 font-mono tabular-nums">{at}</span>
                  <span className="min-w-0 flex-1">{label}</span>
                  <span className="shrink-0 font-mono tabular-nums">{ms}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {canDecide && (
        <div className="flex flex-col gap-3 border-t border-line px-6 pt-4.5 pb-5">
          <label htmlFor="wf-note" className="sr-only">
            Note for the audit trail
          </label>
          <textarea
            id="wf-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={busy}
            placeholder="Add a note for the audit trail (optional)"
            className="w-full resize-none rounded-lg border border-line bg-panel-solid px-3 py-2.5 text-[13px] text-ink-strong outline-none placeholder:text-ink-soft focus-visible:border-accent disabled:opacity-60"
          />
          <div className="flex items-center gap-2.5">
            {/* Decline sits left, the affirmative answers right, with a spacer
                between — so no button has to know which siblings exist. */}
            {decisions.includes('declined') && (
              <DecisionButton decision="declined" busy={busy} onDecide={decide} />
            )}
            <span className="flex-1" />
            {AFFIRMATIVE.filter((d) => decisions.includes(d)).map((d) => (
              <DecisionButton key={d} decision={d} busy={busy} onDecide={decide} />
            ))}
          </div>
        </div>
      )}
    </PanelShell>
  )
}

function DecisionButton({
  decision,
  busy,
  onDecide,
}: {
  decision: Decision
  busy: boolean
  onDecide: (decision: Decision) => void
}) {
  const { label, className } = DECISION_BUTTON[decision]
  return (
    <button
      type="button"
      onClick={() => onDecide(decision)}
      disabled={busy}
      className={`${BUTTON_BASE} ${className}`}
    >
      {label}
    </button>
  )
}
