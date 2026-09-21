import { useMemo, useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon, FunnelIcon, SearchIcon, UndoIcon } from '../icons'
import { ActiveFacetChips } from './active-facet-chips'
import { AddFacetRow } from './add-facet-row'
import { FacetGroupSection } from './facet-group'
import { FACET_DENSITY, FACET_SELECT_ALL_CAP, resolveMode } from './facetRules'
import type { FacetFiltersLabels, FacetFiltersProps, FacetSelection } from './types'

const DEFAULT_LABELS: FacetFiltersLabels = {
  title: 'Filters',
  addSectionTitle: 'Add a facet',
  addButton: 'Add facet',
  activeTitle: 'Active',
  clearAll: 'Clear all',
  findPlaceholder: 'Find a filter…',
  emptyHint: 'No filters yet. Answers draw from everything in scope.',
  scopeNote: 'Applies to every group below.',
}

/**
 * The Filters section of a side rail: a scope control, a hand-entry row, the
 * active chips, and the counted facet groups.
 *
 * Deliberately inert. It fetches nothing, counts nothing and persists nothing
 * — `groups` arrive already counted and `selection` is the host's. That is
 * what makes it portable: the same props are satisfied by a live `/facets`
 * endpoint, a local array, and a fixture. `src/demo/demoFacetStore.ts` is a
 * worked example of the host half, store and all.
 *
 * Counts are the whole argument for this over a combobox, so the component
 * never invents one: an unknown renders as an em dash, and while a refetch is
 * in flight every number blanks to a bar rather than leaving a stale figure on
 * screen reading as true.
 */
export function FacetFilters({
  groups,
  selection,
  onSelectionChange,
  total,
  refreshing = false,
  error,
  onRetry,
  scope,
  facetTypes,
  customFacets = [],
  onAddCustomFacet,
  onRemoveCustomFacet,
  describeFacetType,
  queries = [],
  onAddQuery,
  onRemoveQuery,
  onSearchGroup,
  onLoadMore,
  onLoadAll,
  loadMode = 'button',
  density = 'comfortable',
  showHeader = true,
  onDone,
  onClearAll,
  selectAllCap = FACET_SELECT_ALL_CAP,
  open,
  defaultOpen = true,
  onOpenChange,
  railCollapsed = false,
  onExpandRail,
  labels: labelOverrides,
  className = '',
}: FacetFiltersProps) {
  const labels = { ...DEFAULT_LABELS, ...labelOverrides }
  const spec = FACET_DENSITY[density]
  const compact = density === 'compact'
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen)
  const [find, setFind] = useState('')
  // Remembers only the last bulk add, so Undo reverses that batch and not the
  // picks that were already there. A bulk select is the easiest action here to
  // take by accident and the most tedious to reverse by hand.
  const [lastBulk, setLastBulk] = useState<{ groupKey: string; values: string[] } | null>(null)

  const isOpen = open ?? uncontrolledOpen
  const setOpen = (next: boolean) => {
    onOpenChange?.(next)
    if (open === undefined) setUncontrolledOpen(next)
  }

  const activeCount = useMemo(
    () =>
      Object.values(selection).reduce((sum, values) => sum + values.length, 0) +
      queries.length +
      customFacets.length,
    [selection, queries.length, customFacets.length],
  )

  function setGroup(groupKey: string, values: string[]) {
    const next: FacetSelection = { ...selection }
    if (values.length > 0) next[groupKey] = values
    else delete next[groupKey]
    setLastBulk(null)
    onSelectionChange(next)
  }

  function toggleValue(groupKey: string, value: string) {
    const current = selection[groupKey] ?? []
    setGroup(
      groupKey,
      current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
    )
  }

  function clearEverything() {
    setLastBulk(null)
    if (onClearAll) onClearAll()
    else onSelectionChange({})
  }

  function undoBulk() {
    if (!lastBulk) return
    const current = selection[lastBulk.groupKey] ?? []
    setGroup(
      lastBulk.groupKey,
      current.filter((value) => !lastBulk.values.includes(value)),
    )
  }

  // The slim rail keeps one glyph. The badge is the point of collapsing at
  // all: it is what keeps "four filters are shaping every answer" visible once
  // the labels are gone.
  if (railCollapsed) {
    return (
      <button
        type="button"
        onClick={onExpandRail}
        title={labels.title}
        aria-label={`${labels.title}${activeCount ? `, ${activeCount} active` : ''}`}
        className={`flex w-full items-center justify-center rounded-xl px-2 py-2 text-ink transition hover:bg-panel ${className}`}
      >
        {/* The badge hangs off the glyph, not off the button: the button is
            full-width in the rail, so anchoring to its corner would leave the
            count floating on its own away from the icon it counts for. */}
        <span className="relative grid shrink-0 place-items-center">
          <FunnelIcon className="text-ink-soft" />
          {activeCount > 0 && (
            <span className="absolute -top-2 -right-2.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-accent tabular-nums">
              {activeCount}
            </span>
          )}
        </span>
      </button>
    )
  }

  // With no header of our own there is nothing to collapse into, so the body
  // is always open — the host's panel chrome owns that affordance instead.
  const bodyOpen = showHeader ? isOpen : true

  return (
    <div className={`flex min-h-0 flex-col ${className}`}>
      {showHeader && (
        <button
          type="button"
          onClick={() => setOpen(!isOpen)}
          aria-expanded={isOpen}
          className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-sm font-medium text-ink transition hover:bg-panel ${
            isOpen ? 'bg-panel' : ''
          }`}
        >
          <FunnelIcon className="shrink-0 text-ink-soft" />
          <span className="flex-1 text-left">{labels.title}</span>
          {activeCount > 0 && (
            <span className="grid h-[18px] min-w-[20px] place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-on-accent tabular-nums">
              {activeCount}
            </span>
          )}
          {isOpen ? (
            <ChevronDownIcon width={14} height={14} className="shrink-0 text-ink-soft" />
          ) : (
            <ChevronRightIcon width={14} height={14} className="shrink-0 text-ink-soft" />
          )}
        </button>
      )}

      {bodyOpen && (
        <div
          className={`flex min-h-0 flex-1 flex-col overflow-y-auto pb-1 ${
            compact ? 'gap-2' : 'gap-3'
          } ${showHeader ? 'mt-2' : ''}`}
        >
          {typeof total === 'number' && (
            <div className="flex items-baseline gap-2">
              <p className="flex-1 text-[12px] font-semibold text-ink-strong">
                <span className="tabular-nums">{total.toLocaleString()}</span> items in scope
              </p>
              {activeCount > 0 && (
                <button
                  type="button"
                  onClick={clearEverything}
                  className="text-[11px] font-semibold text-brand-fg transition hover:text-brand-fg-hover"
                >
                  Reset
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-caution-line bg-caution-surface px-2.5 py-2">
              <p className="text-[11.5px] font-semibold text-ink-strong">{error}</p>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-1 text-[11.5px] font-semibold text-brand-fg transition hover:text-brand-fg-hover"
                >
                  Retry
                </button>
              )}
            </div>
          )}

          {/* Scope, not a facet: always applied, single-valued, and its counts
              are cumulative rather than disjoint. Listing it among the
              checkbox groups would teach people that one row is exclusive
              while its neighbours are not. */}
          {scope && (
            <div className="flex items-center gap-2">
              <label
                htmlFor="facet-scope"
                className="shrink-0 text-[10px] font-semibold tracking-[0.12em] text-ink-soft uppercase"
              >
                {scope.label}
              </label>
              <select
                id="facet-scope"
                value={scope.value}
                onChange={(event) => scope.onChange(event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-line bg-panel-solid px-2 py-1.5 text-[12px] font-medium text-ink"
              >
                {scope.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {facetTypes && facetTypes.length > 0 && onAddCustomFacet && (
            <AddFacetRow
              types={facetTypes}
              onAdd={onAddCustomFacet}
              describeType={describeFacetType}
              title={labels.addSectionTitle}
              addLabel={labels.addButton}
              collapsible={compact}
            />
          )}

          <ActiveFacetChips
            groups={groups}
            selection={selection}
            queries={queries}
            customFacets={customFacets}
            onRemoveValue={toggleValue}
            onClearGroup={(groupKey) => setGroup(groupKey, [])}
            onRemoveQuery={onRemoveQuery}
            onRemoveCustom={onRemoveCustomFacet}
            onClearAll={clearEverything}
            title={labels.activeTitle}
            clearAllLabel={labels.clearAll}
            emptyHint={labels.emptyHint}
            maxChips={spec.maxChips}
          />

          <div>
            <div className="relative mb-1">
              <SearchIcon
                width={13}
                height={13}
                className="pointer-events-none absolute top-2 left-2.5 text-ink-soft"
              />
              <input
                type="text"
                value={find}
                onChange={(event) => setFind(event.target.value)}
                aria-label={labels.findPlaceholder}
                placeholder={labels.findPlaceholder}
                className="w-full rounded-lg border border-line bg-panel py-1.5 pr-2 pl-7 text-[12px] text-ink placeholder:text-ink-soft/70"
              />
            </div>

            {groups.map((group, index) => (
              <FacetGroupSection
                key={group.key}
                group={group}
                selected={selection[group.key] ?? []}
                refreshing={refreshing}
                globalQuery={find}
                selectAllCap={selectAllCap}
                onToggleValue={toggleValue}
                onSetGroup={setGroup}
                onBulkAdd={(groupKey, values) => setLastBulk({ groupKey, values })}
                onAddQuery={onAddQuery}
                activeQueries={queries
                  .filter((query) => query.groupKey === group.key)
                  .map((query) => query.query)}
                onSearchGroup={onSearchGroup}
                onLoadMore={onLoadMore}
                onLoadAll={onLoadAll}
                loadMode={loadMode}
                density={density}
                defaultOpen={index < spec.groupsOpen && resolveMode(group) === 'list'}
              />
            ))}
          </div>

          {lastBulk && lastBulk.values.length > 1 && (
            <p className="flex items-center gap-1.5 text-[11px] text-ink-soft">
              <span className="flex-1 tabular-nums">
                {lastBulk.values.length.toLocaleString()} added in one go.
              </span>
              <button
                type="button"
                onClick={undoBulk}
                className="flex items-center gap-1 font-semibold text-brand-fg transition hover:text-brand-fg-hover"
              >
                <UndoIcon width={12} height={12} />
                Undo
              </button>
            </p>
          )}
        </div>
      )}

      {/* Only where the panel covers the thing it filters. Filters still
          apply on tick — you need counts to decide and counts cost the round
          trip either way, so staging would show numbers for a scope that is
          not in effect. This bar says so, and gets out of the way. */}
      {bodyOpen && onDone && (
        <div className="-mx-4 mt-1 flex shrink-0 items-center gap-2.5 border-t border-line bg-panel px-4 py-2">
          <span className="min-w-0 flex-1 text-[11.5px] text-ink-soft">Applied as you tick</span>
          <button
            type="button"
            onClick={onDone}
            className="shrink-0 rounded-lg bg-brand-solid px-4 py-1.5 text-[12px] font-bold text-on-brand-solid"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}
