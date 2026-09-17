// Left panel: what this run is, where it has got to, and what is waiting on you.
//
// Everything run-shaped arrives as props. "Needs you" is a *list*, not a
// boolean: a run can stop on two approvals at once (the onboarding variant
// does), and the old single hardcoded card made the second one invisible.
import { ChevronDownIcon, ChevronLeftIcon } from '../../../lib/components/icons'
import { IconButton } from '../../../lib/components/icon-button'
import { APP_NAME } from '../../config'
import { SectionLabel } from './SectionLabel'
import type { StageSeed } from '../canvas'
import { StageMarker } from '../canvas'
import type { RunActor, RunHeader, VariantInfo } from '../run/wireProtocol'

/** One thing a person has to decide, resolved by the host from the statuses. */
export type NeedsItem = { stepId: string; title: string; sub: string }

export function RunSidebar({
  header,
  actor,
  stages,
  needs,
  selectedStageId,
  onSelectStage,
  variants,
  variantId,
  onVariant,
  onOpenStep,
  onCollapse,
}: {
  header: RunHeader
  actor: RunActor
  stages: StageSeed[]
  needs: NeedsItem[]
  /** The stage being looked at, if any. */
  selectedStageId: string | null
  onSelectStage: (id: string) => void
  /** Empty when there is nothing to switch between — the hard-coded route. */
  variants: VariantInfo[]
  variantId: string
  onVariant: (id: string) => void
  onOpenStep: (id: string) => void
  onCollapse: () => void
}) {
  const current = variants.find((v) => v.id === variantId)

  return (
    // Sized by the collapsing wrapper in WorkflowDemoPage, not by itself.
    <aside className="glass flex h-full w-full flex-col rounded-xl">
      <div className="flex items-center gap-3 px-6 pt-6 pb-5">
        <span className="orb block size-[30px] shrink-0 rounded-full" aria-hidden />
        {/* The app's name, not the run's — so it stays a constant. */}
        <span className="text-[19px] font-bold tracking-tight text-ink-strong">{APP_NAME}</span>
        <IconButton
          shape="rounded"
          onClick={onCollapse}
          className="ml-auto"
          aria-label="Collapse run panel"
          title="Collapse run panel"
        >
          <ChevronLeftIcon width={18} height={18} />
        </IconButton>
      </div>

      {/* Which run you are looking at belongs with the run's identity, not in
          the top bar — that column is ~700px on a 1440 screen and sheds controls
          long before this one would be reachable. */}
      {variants.length > 1 && (
        <div className="px-5 pb-4">
          <label className="flex flex-col gap-1.5">
            <SectionLabel className="px-0.5">Workflow</SectionLabel>
            {/* The native caret is drawn by the platform, so it lands hard
                against the border and matches nothing else here. Turn it off and
                use the app's own chevron, inset to mirror the text's 12px. */}
            <span className="relative block">
              <select
                value={variantId}
                onChange={(e) => onVariant(e.target.value)}
                className="h-9 w-full appearance-none rounded-lg border border-line bg-panel-solid pr-9 pl-3 text-[13px] font-semibold text-ink outline-none focus-visible:border-accent"
              >
                {variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon
                width={16}
                height={16}
                aria-hidden
                className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-soft"
              />
            </span>
          </label>
          {current && (
            <p className="mt-1.5 px-0.5 text-xs leading-[17px] text-ink-soft">{current.blurb}</p>
          )}
        </div>
      )}

      <div className="px-5">
        <div className="rounded-lg bg-panel-solid px-4 py-3.5 shadow-sm ring-1 ring-line">
          <div className="text-sm leading-5 font-bold text-ink-strong">{header.primary}</div>
          <div className="text-[12.5px] leading-[17px] text-ink-soft">{header.secondary}</div>
          <div className="text-[12.5px] leading-[17px] text-ink-soft tabular-nums">
            {header.tertiary}
          </div>
        </div>
      </div>

      {/* Stages take the slack and scroll; "Needs you" below never shrinks.
          That order is the priority: stages are reference, a pending approval is
          the thing being asked of you, and a run waiting on two people must not
          hide the second one below the fold. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="px-5 pt-6 pb-2">
          <SectionLabel className="mb-2 block px-2.5">Stages</SectionLabel>
          <div className="relative flex flex-col gap-0.5">
            {/* Each stage owns a segment of one spine, the way the sidebar's chat
              history groups do. */}
            <span aria-hidden className="absolute top-6 bottom-6 left-[19px] w-px bg-ink-soft/25" />
            {stages.map((stage) => {
              const current = stage.status === 'current'
              const selected = stage.id === selectedStageId
              return (
                /* The outline is how you navigate the canvas, so each row is a
                   button. `current` (where the run is) and `selected` (where you
                   are looking) are different facts and get different weight. */
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => onSelectStage(stage.id)}
                  aria-pressed={selected}
                  className={`relative flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition ${
                    selected
                      ? 'bg-chip ring-1 ring-accent'
                      : current
                        ? 'bg-chip hover:ring-1 hover:ring-accent/40'
                        : 'hover:bg-tint/6'
                  }`}
                >
                  <StageMarker status={stage.status} />
                  <div className="flex min-w-0 flex-col">
                    <span
                      className={`text-sm leading-5 ${
                        current || selected ? 'font-bold text-chip-fg' : 'font-medium text-ink'
                      }`}
                    >
                      {stage.name}
                    </span>
                    <span className="text-xs leading-[17px] text-ink-soft">{stage.sub}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="shrink-0 px-5 pt-5 pb-5">
        <div className="mb-2 flex items-center gap-2 px-2.5">
          <SectionLabel>Needs you</SectionLabel>
          <span className="grid h-[17px] min-w-[17px] place-items-center rounded-full bg-notify px-1.5 text-[10px] font-bold text-on-notify">
            {needs.length}
          </span>
        </div>
        {needs.length > 0 ? (
          <div className="flex flex-col gap-2">
            {needs.map((item) => (
              <button
                key={item.stepId}
                type="button"
                onClick={() => onOpenStep(item.stepId)}
                className="flex w-full items-start gap-3 rounded-lg bg-panel-solid p-3 text-left ring-1 ring-line transition hover:ring-accent/40"
              >
                <span className="mt-[7px] size-2 shrink-0 rounded-full bg-notify" aria-hidden />
                <span className="flex min-w-0 flex-col">
                  <span className="text-[13px] leading-5 font-bold text-ink-strong">
                    {item.title}
                  </span>
                  <span className="text-xs leading-[17px] text-ink-soft">{item.sub}</span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="px-2.5 text-[13px] leading-5 text-ink-soft">
            Nothing waiting on you in this run.
          </p>
        )}
      </div>

      <div className="border-t border-line px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-brand-solid text-xs font-bold text-on-brand-solid">
            {actor.initials}
          </span>
          <div className="flex min-w-0 flex-col text-[13px] leading-tight">
            <span className="truncate font-bold text-ink-strong">{actor.name}</span>
            <span className="truncate text-ink-soft">{actor.role}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
