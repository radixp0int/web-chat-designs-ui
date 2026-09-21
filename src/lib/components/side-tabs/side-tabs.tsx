import { CountBadge } from '../count-badge'
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
      className="flex w-10 shrink-0 flex-col items-center gap-1 border-r border-line py-2"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeId
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            // The count is drawn, so it has to be said too.
            aria-label={tab.badge ? `${tab.label}, ${tab.badge}` : tab.label}
            title={tab.label}
            onClick={() => onSelect(active ? null : tab.id)}
            className={`relative grid size-8 place-items-center rounded-lg transition ${
              active
                ? 'bg-chip text-chip-fg'
                : 'text-ink-soft hover:bg-tint/8 hover:text-ink-strong'
            }`}
          >
            {tab.icon}
            <CountBadge count={tab.badge ?? 0} placement="corner" />
          </button>
        )
      })}
    </div>
  )
}

/** Shared chrome for a tab's panel: titled header with close, scrollable body. */
export function SideTabPanel({ title, onClose, fill = false, children }: SideTabPanelProps) {
  return (
    <>
      <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
        <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink-strong">{title}</p>
        <IconButton onClick={onClose} aria-label={`Close ${title.toLowerCase()}`} title="Close">
          <XIcon width={14} height={14} />
        </IconButton>
      </div>
      <div
        className={
          fill ? 'flex min-h-0 flex-1 flex-col' : 'min-h-0 flex-1 overflow-y-auto px-4 py-3'
        }
      >
        {children}
      </div>
    </>
  )
}
