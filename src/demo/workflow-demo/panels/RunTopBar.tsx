// The bar above the canvas: what this run is, and the controls over it.
//
// Named for the run rather than the app, because demo/components/TopBar.tsx is
// the chat one and these are not interchangeable.
//
// It is sized by a @container, not the viewport: this column is only ~700px wide
// on a 1440 screen, so a viewport breakpoint never fires and the bar overflows
// its panel. As the column narrows it sheds the breadcrumb, then the pill's
// words, then the pill, then the run controls — and only then does the title
// truncate. The details toggle is never dropped: a narrow window is exactly when
// someone wants that 400px back. See DESIGN.md.
import { ChevronRightIcon, HistoryIcon, MenuIcon, RefreshIcon } from '../../../lib/components/icons'
import { IconButton } from '../../../lib/components/icon-button'
import { ThemeToggle } from '../../components/ThemeToggle'
import { PanelRightIcon, PauseIcon, PlayIcon } from '../canvas/icons'
import type { View } from '../canvas'
import type { ControlAction, RunPhase } from '../run'

export function RunTopBar({
  title,
  view,
  onView,
  waitingCount,
  phase,
  onControl,
  runPanelOpen,
  onShowRunPanel,
  detailsOpen,
  onToggleDetails,
  logOpen,
  onToggleLog,
}: {
  title: string
  view: View
  onView: (v: View) => void
  waitingCount: number
  phase: RunPhase
  onControl: (action: ControlAction) => void
  runPanelOpen: boolean
  onShowRunPanel: () => void
  detailsOpen: boolean
  onToggleDetails: () => void
  logOpen: boolean
  onToggleLog: () => void
}) {
  const paused = phase === 'paused'
  const over = phase === 'finished' || phase === 'failed'

  return (
    <div
      className={`flex h-[72px] shrink-0 items-center gap-3 overflow-hidden border-b border-line pr-5 ${
        runPanelOpen ? 'pl-6' : 'pl-3'
      }`}
    >
      {/* With the run panel collapsed this is the app's top-left corner, which is
          where people reach for the menu. */}
      {!runPanelOpen && (
        <IconButton
          shape="rounded"
          onClick={onShowRunPanel}
          className="shrink-0"
          aria-label="Show run panel"
          title="Show run panel"
        >
          <MenuIcon width={18} height={18} />
        </IconButton>
      )}
      {/* First to go when the column gets tight — the page title says it anyway. */}
      <span className="shrink-0 text-[13px] text-ink-soft @max-[880px]:hidden">Workflows</span>
      <ChevronRightIcon
        width={14}
        height={14}
        className="shrink-0 text-ink-soft @max-[880px]:hidden"
      />
      <h1 className="min-w-0 truncate text-base font-bold tracking-tight text-ink-strong">
        {title}
      </h1>
      {/* Sheds words, then disappears — the sidebar's "Needs you" count carries
          the same fact, so this is the first thing that can go. */}
      {waitingCount > 0 && (
        <span className="ml-2 inline-flex h-7 shrink-0 items-center gap-2 rounded-full bg-notify/12 px-3 text-xs font-bold whitespace-nowrap text-ink-strong @max-[620px]:hidden">
          <span className="size-2 rounded-full bg-notify" aria-hidden />
          <span className="@max-[760px]:hidden">
            Waiting on {waitingCount} approval{waitingCount === 1 ? '' : 's'}
          </span>
          <span className="@min-[760px]:hidden">
            {waitingCount} approval{waitingCount === 1 ? '' : 's'}
          </span>
        </span>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <div
          role="group"
          aria-label="Canvas density"
          className="flex shrink-0 rounded-full border border-line bg-tint/5 p-[3px]"
        >
          {(['normal', 'compact'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onView(v)}
              aria-pressed={view === v}
              className={`h-[30px] rounded-full px-4 text-[13px] transition ${
                view === v
                  ? 'bg-panel-solid font-bold text-accent-fg shadow-sm'
                  : 'font-semibold text-ink-soft hover:text-ink-strong'
              }`}
            >
              {v === 'normal' ? 'Normal' : 'Compact'}
            </button>
          ))}
        </div>
        {/* Icon-only: with the toggle, the theme switch and a status pill already
            in here, labelled buttons don't fit the column at any useful width. */}
        <IconButton
          shape="rounded"
          onClick={onToggleLog}
          active={logOpen}
          aria-pressed={logOpen}
          aria-expanded={logOpen}
          aria-controls="wf-run-log"
          aria-label="Run log"
          title="Run log"
          className="@max-[560px]:hidden"
        >
          <HistoryIcon width={16} height={16} />
        </IconButton>
        <IconButton
          shape="rounded"
          onClick={() => onControl(paused ? 'resume' : 'pause')}
          disabled={over}
          active={paused}
          aria-pressed={paused}
          aria-label={paused ? 'Resume run' : 'Pause run'}
          title={paused ? 'Resume run' : 'Pause run'}
          className="@max-[560px]:hidden"
        >
          {paused ? <PlayIcon width={16} height={16} /> : <PauseIcon width={16} height={16} />}
        </IconButton>
        <IconButton
          shape="rounded"
          onClick={() => onControl('restart')}
          aria-label="Restart run"
          title="Restart run"
          className="@max-[560px]:hidden"
        >
          <RefreshIcon width={16} height={16} />
        </IconButton>
        {/* Deliberately never hidden: a narrow window is exactly when someone
            wants the 400px details panel back. */}
        <IconButton
          shape="rounded"
          onClick={onToggleDetails}
          active={detailsOpen}
          aria-pressed={detailsOpen}
          aria-label={detailsOpen ? 'Hide step details' : 'Show step details'}
          title={detailsOpen ? 'Hide step details' : 'Show step details'}
        >
          <PanelRightIcon width={16} height={16} />
        </IconButton>
        <ThemeToggle />
      </div>
    </div>
  )
}
