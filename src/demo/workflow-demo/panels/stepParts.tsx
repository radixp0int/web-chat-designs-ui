// The pieces a step is made of, shared by the two things that draw one: the
// 400px StepInspector and the full-width StepDetail behind its expand button.
//
// They exist as one copy for the same reason PanelShell does — the two views
// cannot be allowed to drift, and the decision form least of all, since that is
// the part that actually does something. What differs between the views is
// arrangement, not these blocks: the panel stacks them in one narrow column,
// the page lays them out in two.
import { useState } from 'react'
import { KindIcon } from '../canvas'
import { FlagIcon } from '../canvas/icons'
import type { StepSeed, StepStatus } from '../canvas'
import type { Decision, RunDetail } from '../run/wireProtocol'
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

/** What kind of step this is, and where it has got to. */
export function StepBadges({
  step,
  status,
}: {
  step: StepSeed<RunDetail>
  status: StepStatus | undefined
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex h-5 items-center gap-1.5 rounded-md bg-chip px-2 text-[11px] font-bold text-chip-fg">
        <KindIcon kind={step.kind} initials={step.initials} size={14} />
        {KIND_LABEL[step.kind]}
      </span>
      {status === 'waiting' ? (
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
  )
}

/**
 * Who it is waiting on, and the flat facts under them.
 *
 * Boxed, and led by the assignee's initials, because as a bare run of grey
 * label/value pairs this was the block readers slid past — in the 400px panel
 * especially. A face is what the eye lands on, and who owns the decision is the
 * fact people check first, so it is a row of its own above the list rather than
 * the first two entries in it. `due` is stated here and nowhere else: a run that
 * also listed it under `rows` would say it twice.
 */
export function StepDetails({ step }: { step: StepSeed<RunDetail> }) {
  const { detail } = step
  const who = step.assignee
  if (!who && detail.rows.length === 0) return null

  return (
    <div className="flex flex-col gap-2.5">
      <SectionLabel>Details</SectionLabel>
      <div className="rounded-lg border border-line p-3.5">
        {who && (
          <div className="flex items-center gap-2.5 border-b border-line pb-3">
            {step.initials && (
              <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-brand-solid text-[11px] font-extrabold text-on-brand-solid">
                {step.initials}
              </span>
            )}
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] leading-[18px] font-bold text-ink-strong">
                {who}
              </span>
              {detail.due && (
                <span className="truncate text-xs leading-4 text-ink-soft">{detail.due}</span>
              )}
            </span>
          </div>
        )}
        {detail.rows.length > 0 && (
          <dl
            className={`grid grid-cols-[92px_minmax(0,1fr)] gap-x-3.5 gap-y-1.5 ${who ? 'mt-3' : ''}`}
          >
            {detail.rows.map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-[12.5px] leading-5 text-ink-soft">{k}</dt>
                <dd className="text-[13px] leading-5 font-medium text-ink-strong">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  )
}

export function Recommendation({ rec }: { rec: NonNullable<RunDetail['recommendation']> }) {
  return (
    <div className="flex flex-col gap-2.5">
      <SectionLabel>{rec.label ?? 'Agent recommendation'}</SectionLabel>
      {/* --canvas, not --panel-solid: the expanded view's own background IS
          panel-solid, so the card was white on white there and read flat. This
          value is distinct from that page AND from the panel's translucent
          shell, so one card works in both and neither view needs a variant. */}
      <div className="rounded-lg bg-canvas p-4 ring-1 ring-line">
        <div className="flex items-center gap-2.5">
          <KindIcon kind="agent" size={16} />
          <span className="text-xs text-ink-soft">{rec.from}</span>
        </div>
        <p className="mt-3 text-[15px] leading-5 font-bold text-ink-strong">{rec.verdict}</p>
        <div className="mt-3 grid grid-cols-3 gap-2.5 border-t border-line pt-3">
          {rec.figures.map(([k, v]) => (
            <div key={k} className="flex flex-col">
              <span className="text-[11px] text-ink-soft">{k}</span>
              <span className="text-sm font-bold text-ink-strong tabular-nums">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * A callout rather than a paragraph. This is the thing that makes the run stop
 * for a person at all, and as plain text between two other blocks it was the
 * easiest item on the page to skim past. Warm rather than --danger: an
 * exception is a caveat to weigh, not a failure.
 */
export function PolicyException({ exc }: { exc: NonNullable<RunDetail['exception']> }) {
  return (
    <div className="flex flex-col gap-2.5">
      <SectionLabel tone="caution">{exc.label ?? 'Policy exception'}</SectionLabel>
      <div className="flex gap-3 rounded-lg bg-caution-surface p-3.5 ring-1 ring-caution-line">
        <FlagIcon width={17} height={17} className="mt-px shrink-0 text-caution" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[13.5px] leading-5 font-semibold text-ink-strong">{exc.text}</span>
          <span className="text-xs leading-[18px] text-ink-soft">{exc.mitigant}</span>
        </div>
      </div>
    </div>
  )
}

export function HowItGotHere({ trace }: { trace: NonNullable<RunDetail['trace']> }) {
  return (
    <div className="flex flex-col gap-2.5">
      <SectionLabel>How it got here</SectionLabel>
      <ol className="turn-rail flex flex-col gap-1.5 pl-4 text-xs leading-4 text-ink-soft">
        {trace.map(([at, label, ms]) => (
          <li key={`${at}-${label}`} className="flex items-baseline gap-3">
            <span className="w-9 shrink-0 font-mono tabular-nums">{at}</span>
            <span className="min-w-0 flex-1">{label}</span>
            <span className="shrink-0 font-mono tabular-nums">{ms}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/**
 * What a yes sets running. Shown only where there is room for it — the expanded
 * view — and only on a gate, since "next" is a question you ask before
 * deciding, not after. The steps come from the graph, so it says what the run
 * actually does rather than repeating the `If approved` row.
 */
export function NextIfApproved({ steps }: { steps: StepSeed<RunDetail>[] }) {
  if (steps.length === 0) return null
  return (
    <div className="flex flex-col gap-2.5">
      <SectionLabel>Next if approved</SectionLabel>
      <div className="flex flex-col gap-2.5 rounded-lg border border-dashed border-line p-3.5">
        {steps.map((s) => (
          <div key={s.id} className="flex items-center gap-2.5">
            <span className="size-[7px] shrink-0 rounded-full bg-ink-soft/40" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{s.title}</span>
            <span className="shrink-0 text-xs text-ink-soft">{s.meta}</span>
          </div>
        ))}
      </div>
    </div>
  )
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

/**
 * The note and the answers. The note belongs to the decision in front of you,
 * so callers mount this with `key={step.id}`: the remount clears it, which is
 * one less effect than watching the id and resetting.
 *
 * `id` namespaces the textarea's label, because the panel and the expanded view
 * can both be in the document at once.
 */
export function DecisionForm({
  id,
  decisions,
  busy,
  onDecide,
}: {
  id: string
  /** Which buttons this gate allows. */
  decisions: Decision[]
  /** A decision is in flight — the server hasn't answered yet. */
  busy: boolean
  onDecide: (decision: Decision, note?: string) => void
}) {
  const [note, setNote] = useState('')
  const decide = (decision: Decision) => onDecide(decision, note.trim() || undefined)

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={id} className="sr-only">
        Note for the audit trail
      </label>
      <textarea
        id={id}
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
