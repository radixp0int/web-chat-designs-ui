import type { FacetRowModel } from './facetRules'
import { countLabel } from './facetRules'

export type FacetRowProps = {
  row: FacetRowModel
  /** Counts are mid-flight: show a bar, keep the row clickable. */
  refreshing: boolean
  onToggle: (value: string) => void
  /** Fixed height, for rows inside a virtual window. */
  height?: number
  /** Set on virtualized rows, where only a slice of the list is in the tree. */
  posInSet?: number
  setSize?: number
}

/**
 * One option. The whole row is the target because the `<label>` wraps the
 * input — a 15px checkbox is a legal target only in the sense that nobody
 * measured it.
 *
 * A row that cannot match is disabled rather than hidden. Removing it would
 * move everything below it in the instant someone is aiming at it, and it also
 * throws away the answer they came for: that this option is exhausted.
 */
export function FacetRow({ row, refreshing, onToggle, height, posInSet, setSize }: FacetRowProps) {
  const dead = !row.available
  const shown = countLabel(row.count, refreshing)
  const spoken = typeof row.count === 'number' ? `, ${row.count.toLocaleString()} results` : ''

  return (
    <li
      style={height ? { height } : undefined}
      aria-posinset={posInSet}
      aria-setsize={setSize}
      className="list-none"
    >
      <label
        className={`flex h-full items-center gap-2.5 rounded-lg px-2 ${height ? '' : 'py-1.5'} ${
          row.selected ? 'bg-tint/6' : dead ? '' : 'hover:bg-tint/8'
        } ${dead ? 'cursor-default opacity-45' : 'cursor-pointer'}`}
      >
        <input
          type="checkbox"
          checked={row.selected}
          disabled={dead}
          onChange={() => onToggle(row.value)}
          className="size-[15px] shrink-0 accent-accent"
        />
        <span
          className={`min-w-0 flex-1 truncate text-[12.5px] ${
            row.selected ? 'font-semibold text-ink-strong' : 'text-ink'
          }`}
        >
          {row.label}
        </span>
        {shown === null ? (
          <span aria-hidden className="h-2 w-6 shrink-0 rounded-full bg-line" />
        ) : (
          <span
            aria-hidden
            className={`shrink-0 text-[11.5px] tabular-nums ${
              row.selected ? 'font-semibold text-chip-fg' : 'text-ink-soft'
            }`}
          >
            {shown}
          </span>
        )}
        <span className="sr-only">{spoken}</span>
      </label>
    </li>
  )
}
