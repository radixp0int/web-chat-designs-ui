// Right panel, stage version: what a whole stage contains and where it has got
// to. This is what a stage click lands on — picking a stage with nowhere to look
// would make the outline feel broken.
import { KindIcon, StageMarker, StatusMark, DEFAULT_STATUS_LABEL } from '../canvas'
import type { StageSeed, StatusMap, StepSeed, StepStatus } from '../canvas'
import type { RunDetail } from '../run'
import { PanelShell } from './PanelShell'
import { SectionLabel } from './SectionLabel'

const STAGE_STATUS_LABEL = {
  done: 'Finished',
  current: 'In progress',
  upcoming: 'Not started yet',
} as const

/** Rolls the stage's step statuses up into one line, e.g. "3 done · 1 running". */
function tally(steps: StepSeed<RunDetail>[], statuses: StatusMap): string {
  const order: StepStatus[] = [
    'running',
    'waiting',
    'failed',
    'done',
    'approved',
    'changes',
    'queued',
    'skipped',
  ]
  const label: Record<StepStatus, string> = {
    done: 'done',
    running: 'running',
    waiting: 'waiting on a person',
    queued: 'queued',
    skipped: 'skipped',
    failed: 'failed',
    approved: 'approved',
    changes: 'sent back',
  }
  const counts = new Map<StepStatus, number>()
  for (const s of steps) {
    const st = statuses[s.id]
    if (st) counts.set(st, (counts.get(st) ?? 0) + 1)
  }
  return order
    .filter((st) => counts.has(st))
    .map((st) => `${counts.get(st)} ${label[st]}`)
    .join(' · ')
}

export function StageInspector({
  stage,
  steps,
  statuses,
  selectedStepId,
  onSelectStep,
  onClose,
}: {
  stage: StageSeed
  /** Only this stage's steps, in graph order. */
  steps: StepSeed<RunDetail>[]
  statuses: StatusMap
  selectedStepId: string | null
  onSelectStep: (id: string) => void
  onClose: () => void
}) {
  return (
    <PanelShell title="Stage details" onClose={onClose}>
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-5 items-center gap-1.5 rounded-md bg-chip px-2 text-[11px] font-bold text-chip-fg">
              <StageMarker status={stage.status} />
              Stage
            </span>
            <span className="ml-auto text-xs font-semibold text-ink-soft">
              {STAGE_STATUS_LABEL[stage.status]}
            </span>
          </div>
          <h2 className="text-[19px] leading-[26px] font-bold tracking-tight text-ink-strong">
            {stage.name}
          </h2>
          <p className="text-[13px] leading-[21px] text-pretty text-ink-soft">{stage.sub}</p>
        </div>

        <div className="flex flex-col gap-2.5">
          <SectionLabel>
            {steps.length} {steps.length === 1 ? 'step' : 'steps'}
          </SectionLabel>
          {steps.length > 0 && (
            <p className="text-[12.5px] leading-[18px] text-ink-soft">{tally(steps, statuses)}</p>
          )}
          <div className="flex flex-col gap-0.5">
            {steps.map((step) => {
              const status = statuses[step.id]
              const selected = step.id === selectedStepId
              return (
                // Drilling in from here is the point: a stage is a way of
                // finding the step you actually wanted.
                <button
                  key={step.id}
                  type="button"
                  onClick={() => onSelectStep(step.id)}
                  aria-current={selected ? 'true' : undefined}
                  className={`-mx-2 flex min-h-11 items-center gap-2.5 rounded-lg px-2 text-left transition hover:bg-tint/8 ${
                    selected ? 'bg-chip' : ''
                  }`}
                >
                  <KindIcon kind={step.kind} initials={step.initials} size={20} />
                  <span
                    className={`min-w-0 flex-1 truncate text-[12.5px] ${
                      step.mono ? 'font-mono' : 'font-semibold'
                    } ${selected ? 'text-ink-strong' : 'text-ink'}`}
                  >
                    {step.title}
                  </span>
                  {status && (
                    <StatusMark
                      status={status}
                      text={step.statusLabel ?? DEFAULT_STATUS_LABEL[status]}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </PanelShell>
  )
}
