import { FACET_PAGE_SIZE, isHeavyLoad, weightOf } from './facetRules'

export type LoadControlsProps = {
  /** Values that exist but have not been fetched. Nothing renders at zero. */
  remaining: number
  /**
   * What one "more" actually fetches — the host's page size. The label is a
   * promise, so it has to come from whoever keeps it.
   */
  pageSize?: number
  onLoadMore?: () => void
  onLoadAll?: () => void
}

/**
 * The two ways to get more of a paged list, both on a button that names its
 * number.
 *
 * Knows nothing about facets: it is the footer any paged list wants, and it
 * lives in its own file so the group component reads as layout.
 *
 * "Load all" states its price once the price is worth stating. 19,912 more and
 * 43 more are not the same decision, and a bare "Load all" hides which one
 * this is — but a warning on every click would be one nobody reads, so it
 * turns cautionary only past FACET_LOAD_ALL_HEAVY_BYTES.
 */
export function LoadControls({
  remaining,
  pageSize = FACET_PAGE_SIZE,
  onLoadMore,
  onLoadAll,
}: LoadControlsProps) {
  if (remaining <= 0 || !(onLoadMore || onLoadAll)) return null
  const heavy = isHeavyLoad(remaining)

  return (
    <div className="mt-1.5">
      <div className="flex gap-1.5">
        {onLoadMore && (
          <button
            type="button"
            onClick={onLoadMore}
            className="flex-1 rounded-lg border border-line bg-panel-solid px-2 py-1.5 text-[11.5px] font-semibold text-ink-strong transition hover:bg-tint/8"
          >
            Load {Math.min(pageSize, remaining).toLocaleString()} more
          </button>
        )}
        {onLoadAll && (
          <button
            type="button"
            onClick={onLoadAll}
            className={`flex-1 rounded-lg px-2 py-1.5 text-[11.5px] font-semibold transition ${
              heavy ? 'bg-caution-surface text-caution' : 'bg-chip text-chip-fg hover:bg-chip-hover'
            }`}
          >
            Load all {remaining.toLocaleString()}
          </button>
        )}
      </div>
      <p
        className={`mt-1 px-0.5 text-[10.5px] leading-snug ${heavy ? 'text-caution' : 'text-ink-soft'}`}
      >
        {heavy
          ? `${remaining.toLocaleString()} more — about ${weightOf(remaining)}. Searching first is usually cheaper.`
          : `${remaining.toLocaleString()} more to fetch.`}
      </p>
    </div>
  )
}
