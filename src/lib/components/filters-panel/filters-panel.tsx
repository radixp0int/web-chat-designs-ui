import { useBranding } from '../../branding'
import { XIcon } from '../icons'
import type { FiltersPanelProps } from './types'

/** Currently selected filter chips, grouped by facet. UI only for now. */
export function FiltersPanel({ filters, onRemove, onClear }: FiltersPanelProps) {
  const { appName } = useBranding()

  if (filters.length === 0) {
    return (
      <p className="py-2 text-xs text-(--text-soft)">
        No active filters. Answers draw from everything {appName} can see.
      </p>
    )
  }

  const groups = [...new Set(filters.map((f) => f.group))]

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-(--text-soft)">
          {filters.length} active {filters.length === 1 ? 'filter' : 'filters'}
        </p>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-brand-500 transition hover:text-brand-600 dark:text-brand-300 dark:hover:text-brand-200"
        >
          Clear all
        </button>
      </div>

      {groups.map((group) => (
        <div key={group}>
          <p className="mb-1.5 text-[10px] font-semibold tracking-wide text-(--text-soft) uppercase">
            {group}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {filters
              .filter((f) => f.group === group)
              .map((f) => (
                <span
                  key={f.id}
                  className="flex items-center gap-1 rounded-lg border border-(--panel-border) py-1 pr-1 pl-2 text-xs text-(--text-body)"
                >
                  {f.label}
                  <button
                    type="button"
                    onClick={() => onRemove(f.id)}
                    aria-label={`Remove ${f.label} filter`}
                    title="Remove"
                    className="rounded p-0.5 text-(--text-soft) transition hover:bg-brand-600/8 hover:text-(--text-strong) dark:hover:bg-white/8"
                  >
                    <XIcon width={11} height={11} />
                  </button>
                </span>
              ))}
          </div>
        </div>
      ))}

      <p className="text-[11px] leading-relaxed text-(--text-soft)/80">
        Filters narrow what the assistant searches when answering.
      </p>
    </div>
  )
}
