// Left panel: what this run is, where it has got to, and what is waiting on you.
import { Link } from 'react-router'
import { ChevronLeftIcon } from '../../../lib/components/icons'
import { IconButton } from '../../../lib/components/icon-button'
import { APP_NAME } from '../../config'
import type { StatusMap } from '../canvas'
import { STAGES } from './loanRun'
import { StageMarker } from '../canvas'

export function RunSidebar({
  statuses,
  onOpenApproval,
  onCollapse,
}: {
  statuses: StatusMap
  onOpenApproval: () => void
  onCollapse: () => void
}) {
  const waiting = statuses.approve === 'waiting'

  return (
    // Sized by the collapsing wrapper in WorkflowDemoPage, not by itself.
    <aside className="glass flex h-full w-full flex-col rounded-xl">
      <div className="flex items-center gap-3 px-6 pt-6 pb-5">
        <span className="orb block size-[30px] shrink-0 rounded-full" aria-hidden />
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

      <div className="px-5">
        <div className="rounded-lg bg-panel-solid px-4 py-3.5 shadow-sm ring-1 ring-line">
          <div className="text-sm leading-5 font-bold text-ink-strong">
            Harbor Street Bakery LLC
          </div>
          <div className="text-[12.5px] leading-[17px] text-ink-soft">
            Commercial term loan · $450,000
          </div>
          <div className="text-[12.5px] leading-[17px] text-ink-soft tabular-nums">
            Run 4821 · started 9:02 AM
          </div>
        </div>
      </div>

      <div className="px-5 pt-6">
        <div className="mb-2 px-2.5 text-[11px] font-bold tracking-[0.14em] text-ink-soft uppercase">
          Stages
        </div>
        <div className="relative flex flex-col gap-0.5">
          {/* Each stage owns a segment of one spine, the way the sidebar's chat
              history groups do. */}
          <span aria-hidden className="absolute top-6 bottom-6 left-[19px] w-px bg-ink-soft/25" />
          {STAGES.map((stage) => {
            const current = stage.status === 'current'
            return (
              <div
                key={stage.id}
                className={`relative flex items-center gap-3 rounded-lg p-2.5 ${
                  current ? 'bg-chip' : ''
                }`}
              >
                <StageMarker status={stage.status} />
                <div className="flex min-w-0 flex-col">
                  <span
                    className={`text-sm leading-5 ${
                      current ? 'font-bold text-chip-fg' : 'font-medium text-ink'
                    }`}
                  >
                    {stage.name}
                  </span>
                  <span className="text-xs leading-[17px] text-ink-soft">{stage.sub}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="px-5 pt-6">
        <div className="mb-2 flex items-center gap-2 px-2.5">
          <span className="text-[11px] font-bold tracking-[0.14em] text-ink-soft uppercase">
            Needs you
          </span>
          <span className="grid h-[17px] min-w-[17px] place-items-center rounded-full bg-notify px-1.5 text-[10px] font-bold text-on-notify">
            {waiting ? 1 : 0}
          </span>
        </div>
        {waiting ? (
          <button
            type="button"
            onClick={onOpenApproval}
            className="flex w-full items-start gap-3 rounded-lg bg-panel-solid p-3 text-left ring-1 ring-line transition hover:ring-accent/40"
          >
            <span className="mt-[7px] size-2 shrink-0 rounded-full bg-notify" aria-hidden />
            <span className="flex flex-col">
              <span className="text-[13px] leading-5 font-bold text-ink-strong">
                Approve credit memo
              </span>
              <span className="text-xs leading-[17px] text-ink-soft">Due in 3h 40m</span>
            </span>
          </button>
        ) : (
          <p className="px-2.5 text-[13px] leading-5 text-ink-soft">
            Nothing waiting on you in this run.
          </p>
        )}
      </div>

      <div className="flex-1" />

      <div className="border-t border-line px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="grid size-[34px] shrink-0 place-items-center rounded-full bg-brand-solid text-xs font-bold text-on-brand-solid">
            DW
          </span>
          <div className="flex min-w-0 flex-col text-[13px] leading-tight">
            <span className="font-bold text-ink-strong">Dana Whitfield</span>
            <span className="text-ink-soft">Credit analyst</span>
          </div>
        </div>
        <Link
          to="/"
          className="mt-3 block text-xs font-semibold text-accent-fg underline-offset-2 hover:underline"
        >
          Back to demos
        </Link>
      </div>
    </aside>
  )
}
