import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon, SearchIcon, XIcon } from '../icons'
import { IconButton } from '../icon-button'
import { FacetRow } from './facet-row'
import { LoadControls } from './load-controls'
import { useDebounced } from './useDebounced'
import { useVirtualRows } from './useVirtualRows'
import {
  FACET_DENSITY,
  FACET_ROW_HEIGHT,
  FACET_VIRTUALIZE_THRESHOLD,
  filterRows,
  isSearchable,
  orderRows,
  resolveMode,
  selectableOf,
  remainingOf,
  toRows,
  triState,
  windowHeight,
} from './facetRules'
import type { FacetDensity } from './facetRules'
import type { FacetGroup, FacetQuery } from './types'

export type FacetGroupSectionProps = {
  group: FacetGroup
  selected: string[]
  refreshing: boolean
  /** The section-wide "find a filter" text. Opens matching groups. */
  globalQuery: string
  selectAllCap: number
  onToggleValue: (groupKey: string, value: string) => void
  /** Bulk replace — select-all and clear both go through here. */
  onSetGroup: (groupKey: string, values: string[]) => void
  /** Reported so the section can offer Undo on a bulk select. */
  onBulkAdd?: (groupKey: string, values: string[]) => void
  onAddQuery?: (query: FacetQuery) => void
  /** Queries already promoted to chips for this group, so the offer is not repeated. */
  activeQueries?: string[]
  /** Must be referentially stable — it runs in an effect on every query change. */
  onSearchGroup?: (groupKey: string, query: string) => void
  onLoadMore?: (groupKey: string) => void
  onLoadAll?: (groupKey: string) => void
  loadMode?: 'button' | 'scroll'
  /** The host's page size, so "Load N more" names a number it honours. */
  pageSize?: number
  density?: FacetDensity
  defaultOpen?: boolean
}

/**
 * One collapsible group of options.
 *
 * Owns only ephemeral UI state — open, its own search text, whether the dead
 * rows are showing. Selection lives with the host, because the host is what
 * turns it into a request.
 */
export function FacetGroupSection({
  group,
  selected,
  refreshing,
  globalQuery,
  selectAllCap,
  onToggleValue,
  onSetGroup,
  onBulkAdd,
  onAddQuery,
  activeQueries,
  onSearchGroup,
  onLoadMore,
  onLoadAll,
  loadMode = 'button',
  pageSize,
  density = 'comfortable',
  defaultOpen = false,
}: FacetGroupSectionProps) {
  const spec = FACET_DENSITY[density]
  const mode = resolveMode(group)
  const [open, setOpen] = useState(defaultOpen)
  const [query, setQuery] = useState('')
  const [showDead, setShowDead] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const boxRef = useRef<HTMLInputElement | null>(null)

  // The group's own field wins; otherwise the section-wide search drives it,
  // so one query reaches a 20k lookup without a second box to type into.
  const effectiveQuery = query || globalQuery
  const settledQuery = useDebounced(effectiveQuery, 150)

  useEffect(() => {
    if (mode === 'lookup' && onSearchGroup) onSearchGroup(group.key, settledQuery)
  }, [settledQuery, group.key, mode, onSearchGroup])

  // A host answering a lookup has already applied the query; filtering its
  // answer again would drop rows it matched on something we cannot see.
  const serverFiltered = mode === 'lookup' && !!onSearchGroup

  const rows = useMemo(() => {
    const all = toRows(group, selected)
    return orderRows(serverFiltered ? all : filterRows(all, effectiveQuery))
  }, [group, selected, serverFiltered, effectiveQuery])

  const visible = showDead ? rows : rows.filter((row) => row.available)
  const deadCount = rows.length - visible.length

  const searching = effectiveQuery.trim().length > 0
  // "Show N more" only at rest: with a search running, the matches are the point.
  const capped = mode === 'list' && !expanded && !searching && visible.length > spec.listPreview
  const rendered = capped ? visible.slice(0, spec.listPreview) : visible
  const virtual = rendered.length > FACET_VIRTUALIZE_THRESHOLD

  const total = group.cardinality ?? group.values.length
  const matchCount = group.matchCount ?? rows.length

  // Only wired up when the host opted back into load-on-scroll; otherwise
  // fetching is something the viewer asks for, on a control that names the
  // number it is about to pull.
  const nearEnd = useCallback(() => {
    if (loadMode === 'scroll' && group.hasMore) onLoadMore?.(group.key)
  }, [loadMode, group.hasMore, group.key, onLoadMore])

  const viewHeight = windowHeight(density)
  const virtualWindow = useVirtualRows({
    count: rendered.length,
    rowHeight: FACET_ROW_HEIGHT,
    height: viewHeight,
    resetKey: `${group.key}:${settledQuery}`,
    onNearEnd: nearEnd,
  })

  const remaining = remainingOf(group.loaded ?? group.values.length, group.matchCount)

  // A section-wide search that hit something opens the group on its own —
  // hiding matches behind a caret defeats the point of searching.
  const isOpen = (globalQuery.trim().length > 0 && visible.length > 0) || open

  const state = triState(visible)
  const selectable = selectableOf(visible)
  useEffect(() => {
    if (boxRef.current) boxRef.current.indeterminate = state === 'some'
  }, [state])

  const selectAllLabel =
    state === 'all'
      ? `Clear all ${group.label} filters`
      : `Select all ${selectable.length} available in ${group.label}`

  function takeAll() {
    if (state === 'all') {
      onSetGroup(group.key, [])
      return
    }
    const values = selectable.map((row) => row.value)
    const added = values.filter((value) => !selected.includes(value))
    onSetGroup(group.key, values)
    if (added.length > 1) onBulkAdd?.(group.key, added)
  }

  // Enumerating is only offered when every match is actually in hand. Past the
  // cap the honest move is a predicate, not four thousand values in a request.
  const loadedAll = selectable.length >= matchCount
  const promoted = (activeQueries ?? []).includes(effectiveQuery.trim())
  const canEnumerate =
    mode === 'lookup' && searching && matchCount > 0 && matchCount <= selectAllCap && loadedAll
  const tooMany = mode === 'lookup' && searching && matchCount > selectAllCap && !promoted

  const meta =
    mode === 'lookup'
      ? selected.length
        ? `${selected.length.toLocaleString()} picked`
        : total.toLocaleString()
      : selected.length
        ? `${selected.length} of ${total}`
        : String(total)

  const rowProps = { refreshing, onToggle: (value: string) => onToggleValue(group.key, value) }

  return (
    <div className="border-t border-line pt-1">
      <div className="flex items-center gap-1.5">
        {mode === 'list' && (
          <input
            ref={boxRef}
            type="checkbox"
            checked={state === 'all'}
            onChange={takeAll}
            aria-label={selectAllLabel}
            title={selectAllLabel}
            className="ml-1 size-[14px] shrink-0 cursor-pointer accent-accent"
          />
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={isOpen}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-1 py-1.5 text-left transition hover:bg-tint/8"
        >
          {isOpen ? (
            <ChevronDownIcon width={13} height={13} className="shrink-0 text-ink-soft" />
          ) : (
            <ChevronRightIcon width={13} height={13} className="shrink-0 text-ink-soft" />
          )}
          <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-ink-strong">
            {group.label}
          </span>
          {mode === 'lookup' && (
            <SearchIcon width={11} height={11} className="shrink-0 text-ink-soft" />
          )}
          <span
            className={`shrink-0 text-[10.5px] font-semibold tabular-nums ${
              selected.length ? 'text-brand-fg' : 'text-ink-soft'
            }`}
          >
            {meta}
          </span>
        </button>
        {selected.length > 0 && (
          <IconButton
            size="sm"
            shape="rounded"
            onClick={() => onSetGroup(group.key, [])}
            aria-label={`Clear ${group.label} filters`}
            title="Clear"
          >
            <XIcon width={11} height={11} />
          </IconButton>
        )}
      </div>

      {isOpen && (
        <div className="pb-1.5">
          {isSearchable(group, mode) && !globalQuery.trim() && (
            <div className="relative pb-1.5">
              <SearchIcon
                width={12}
                height={12}
                className="pointer-events-none absolute top-2 left-2 text-ink-soft"
              />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label={`Filter ${group.label} options`}
                placeholder={
                  mode === 'lookup'
                    ? `Search ${total.toLocaleString()} values`
                    : `Filter ${total} options`
                }
                className="w-full rounded-lg border border-line bg-panel py-1.5 pr-2 pl-7 text-[11.5px] text-ink placeholder:text-ink-soft/70"
              />
            </div>
          )}

          {tooMany && (
            <div className="mb-1.5 rounded-lg border border-caution-line bg-caution-surface px-2.5 py-2">
              <p className="text-[11px] leading-relaxed text-ink-soft">
                <strong className="font-semibold text-ink-strong tabular-nums">
                  {matchCount.toLocaleString()} matches
                </strong>{' '}
                — too many to carry as individual values.
              </p>
              <button
                type="button"
                onClick={() => {
                  onAddQuery?.({
                    groupKey: group.key,
                    query: effectiveQuery.trim(),
                    count: matchCount,
                  })
                  // The predicate is now a chip; leaving the text behind would
                  // keep offering the thing that just happened.
                  setQuery('')
                }}
                className="mt-1.5 rounded-full bg-brand-solid px-2.5 py-1 text-[11px] font-semibold text-on-brand-solid"
              >
                Filter by this search instead
              </button>
            </div>
          )}

          {canEnumerate && (
            <button
              type="button"
              onClick={() => {
                const values = selectable.map((row) => row.value)
                const added = values.filter((value) => !selected.includes(value))
                onSetGroup(group.key, Array.from(new Set([...selected, ...values])))
                if (added.length > 1) onBulkAdd?.(group.key, added)
              }}
              className="mb-1 px-1 text-[11px] font-semibold text-brand-fg transition hover:text-brand-fg-hover"
            >
              Select all {matchCount.toLocaleString()}
            </button>
          )}

          {group.loading && rendered.length === 0 ? (
            <p className="px-2 py-1.5 text-[11.5px] text-ink-soft">Searching…</p>
          ) : rendered.length === 0 ? (
            <p className="px-2 py-1.5 text-[11.5px] text-ink-soft">
              {mode === 'lookup' && !searching
                ? 'Type to search this group.'
                : 'Nothing here matches that.'}
            </p>
          ) : virtual ? (
            <div
              ref={virtualWindow.scrollRef}
              onScroll={virtualWindow.onScroll}
              style={{ height: viewHeight }}
              className="overflow-y-auto rounded-lg border border-line"
            >
              <div style={{ height: virtualWindow.padTop }} />
              <ul role="list" className="m-0 list-none p-0">
                {rendered.slice(virtualWindow.start, virtualWindow.end).map((row, index) => (
                  <FacetRow
                    key={row.value}
                    row={row}
                    {...rowProps}
                    height={FACET_ROW_HEIGHT}
                    posInSet={virtualWindow.start + index + 1}
                    setSize={rendered.length}
                  />
                ))}
              </ul>
              <div style={{ height: virtualWindow.padBottom }} />
            </div>
          ) : (
            <ul role="list" className="m-0 list-none p-0">
              {rendered.map((row) => (
                <FacetRow key={row.value} row={row} {...rowProps} />
              ))}
            </ul>
          )}

          {loadMode === 'button' && (
            <LoadControls
              remaining={remaining}
              pageSize={pageSize}
              onLoadMore={onLoadMore ? () => onLoadMore(group.key) : undefined}
              onLoadAll={onLoadAll ? () => onLoadAll(group.key) : undefined}
            />
          )}

          {state === 'all' && !group.nullable && selectable.length > 1 && (
            <p className="mt-1 px-2 text-[11px] leading-relaxed text-ink-soft">
              All {selectable.length} selected. Items with no {singular(group.label)} stay excluded
              — this is not the same as clearing the group.
            </p>
          )}

          {capped && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mt-0.5 px-2 py-1 text-[11.5px] font-semibold text-brand-fg transition hover:text-brand-fg-hover"
            >
              Show {visible.length - spec.listPreview} more
            </button>
          )}

          {deadCount > 0 && (
            <button
              type="button"
              onClick={() => setShowDead((v) => !v)}
              className="mt-0.5 px-2 py-1 text-[11.5px] font-semibold text-brand-fg transition hover:text-brand-fg-hover"
            >
              {showDead ? 'Hide unavailable' : `Show ${deadCount} unavailable`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function singular(label: string): string {
  return label.toLowerCase().replace(/s$/, '')
}
