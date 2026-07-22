import { XIcon } from '../icons'
import { IconButton } from '../icon-button'
import type { SideTabRailProps, SideTabPanelProps } from './types'

/**
 * A vertical icon rail with slide-in panels, modeled after the side tabs in
 * builder-style UIs. The rail is generic: each tab is an id + icon + label
 * (and an optional count badge), and the host decides what panel content a
 * tab opens. Adding a tab is one entry in the host's tabs array.
 */
export function SideTabRail({ tabs, activeId, onSelect }: SideTabRailProps) {
  return (
    <div
      role="tablist"
      aria-orientation="vertical"
      className="flex w-10 shrink-0 flex-col items-center gap-1 border-r border-(--panel-border) py-2"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={tab.label}
            title={tab.label}
            onClick={() => onSelect(active ? null : tab.id)}
            className={`relative grid size-8 place-items-center rounded-lg transition ${
              active
                ? 'bg-brand-600/12 text-brand-600 dark:bg-brand-300/15 dark:text-brand-300'
                : 'text-(--text-soft) hover:bg-brand-600/8 hover:text-(--text-strong) dark:hover:bg-white/8'
            }`}
          >
            {tab.icon}
            {tab.badge ? (
              <span className="absolute -top-0.5 -right-0.5 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-accent-500 px-0.5 text-[9px] font-semibold text-white">
                {tab.badge}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

/** Shared chrome for a tab's panel: titled header with close, scrollable body. */
export function SideTabPanel({ title, onClose, children }: SideTabPanelProps) {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-(--panel-border) px-4 py-2.5">
        <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-(--text-strong)">
          {title}
        </p>
        <IconButton onClick={onClose} aria-label={`Close ${title.toLowerCase()}`} title="Close">
          <XIcon width={14} height={14} />
        </IconButton>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">{children}</div>
    </>
  )
}
