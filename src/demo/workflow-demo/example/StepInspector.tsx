// Right panel: the selected step in full, and — for the one step that is waiting
// on a person — the decision itself. Compact nodes plus this panel is the trade
// the "Normal view" makes: the canvas stays scannable, the detail lives here.
import { XIcon } from '../../../lib/components/icons'
import { IconButton } from '../../../lib/components/icon-button'
import { FlagIcon } from '../canvas/icons'
import { KindIcon } from '../canvas'
import type { StatusMap, StepStatus } from '../canvas'
import { STEP_BY_ID } from './loanRun'

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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-bold tracking-[0.14em] text-ink-soft uppercase">
      {children}
    </span>
  )
}

export function StepInspector({
  stepId,
  statuses,
  onClose,
  onDecide,
}: {
  stepId: string | null
  statuses: StatusMap
  onClose: () => void
  onDecide: (decision: 'approved' | 'changes') => void
}) {
  const step = stepId ? STEP_BY_ID.get(stepId) : undefined

  if (!step) {
    return (
      <aside className="flex h-full w-full flex-col border-l border-line bg-panel-solid/45">
        <div className="flex items-center gap-2.5 border-b border-line py-3 pr-3.5 pl-5">
          <span className="flex-1 text-[13px] font-bold text-ink-strong">Step details</span>
          <IconButton onClick={onClose} aria-label="Hide step details" title="Hide step details">
            <XIcon width={14} height={14} />
          </IconButton>
        </div>
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
          <span className="orb block size-8 rounded-full opacity-40" aria-hidden />
          <p className="text-[13px] leading-5 text-ink-soft">
            Select a step on the canvas to see what it produced and what it is waiting on.
          </p>
        </div>
      </aside>
    )
  }

  const status = statuses[step.id]
  const { detail } = step
  const waiting = status === 'waiting'

  return (
    <aside className="flex h-full w-full flex-col border-l border-line bg-panel-solid/45">
      <div className="flex items-center gap-2.5 border-b border-line py-3 pr-3.5 pl-5">
        <span className="flex-1 text-[13px] font-bold text-ink-strong">Step details</span>
        <IconButton onClick={onClose} aria-label="Hide step details" title="Hide step details">
          <XIcon width={14} height={14} />
        </IconButton>
      </div>

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
              <span className="ml-auto text-xs font-semibold text-ink-soft">
                {STATUS_LABEL[status]}
              </span>
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
            <SectionLabel>Agent recommendation</SectionLabel>
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
            <SectionLabel>Policy exception</SectionLabel>
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

      {waiting && (
        <div className="flex flex-col gap-3 border-t border-line px-6 pt-4.5 pb-5">
          <label htmlFor="wf-note" className="sr-only">
            Note for the audit trail
          </label>
          <textarea
            id="wf-note"
            rows={2}
            placeholder="Add a note for the audit trail (optional)"
            className="w-full resize-none rounded-lg border border-line bg-panel-solid px-3 py-2.5 text-[13px] text-ink-strong outline-none placeholder:text-ink-soft focus-visible:border-accent"
          />
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="h-9 rounded-lg px-2.5 text-[13px] font-semibold text-danger-fg transition hover:bg-tint/8"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => onDecide('changes')}
              className="ml-auto h-9 rounded-lg border border-line bg-panel-solid px-3.5 text-[13px] font-semibold text-ink transition hover:bg-tint/6"
            >
              Request changes
            </button>
            <button
              type="button"
              onClick={() => onDecide('approved')}
              className="h-9 rounded-lg bg-accent px-4.5 text-[13px] font-bold text-on-accent transition hover:bg-accent-hover"
            >
              Approve
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
