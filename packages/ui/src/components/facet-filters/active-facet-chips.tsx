import { useMemo, useState } from 'react'
import { ChevronDownIcon } from '../icons'
import { FilterChip } from '../filter-chip'
import { FACET_CHIP_COLLAPSE_AT, resolveMode } from './facetRules'
import type { CustomFacet, FacetGroup, FacetQuery, FacetSelection } from './types'

export type ActiveFacetChipsProps = {
  groups: FacetGroup[]
  selection: FacetSelection
  queries: FacetQuery[]
  customFacets: CustomFacet[]
  onRemoveValue: (groupKey: string, value: string) => void
  onClearGroup: (groupKey: string) => void
  onRemoveQuery?: (query: FacetQuery) => void
  onRemoveCustom?: (id: string) => void
  onClearAll: () => void
  title: string
  clearAllLabel: string
  emptyHint: string
  /** Chips rendered before "+N more" folds the rest away. */
  maxChips?: number
}

/**
 * Everything currently narrowing the answer, in one strip.
 *
 * Three chip shapes, because they are three different promises. A solid chip
 * is a value the index vouched for. A dark chip is a predicate — "Loan
 * contains 1772" — standing in for a selection too large to enumerate. A
 * dashed chip is something the viewer typed that the index never offered.
 *
 * Every chip that needs one names its field: `Merchant: Delta Air Lines`. A
 * hand-entered chip always does, because the field is the thing the reader
 * cannot otherwise work out; a facet chip does it only when its label appears
 * in more than one group, since this data really has a Payroll account and a
 * Payroll category and two identical chips is a bug report waiting to happen.
 */
export function ActiveFacetChips({
  groups,
  selection,
  queries,
  customFacets,
  onRemoveValue,
  onClearGroup,
  onRemoveQuery,
  onRemoveCustom,
  onClearAll,
  title,
  clearAllLabel,
  emptyHint,
  maxChips,
}: ActiveFacetChipsProps) {
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
  const [showAll, setShowAll] = useState(false)

  // Which labels collide across groups. Lookup groups are skipped: their
  // values are identifiers, and walking 20,000 of them on every render to
  // discover they collide with nothing is work for no answer.
  const ambiguous = useMemo(() => {
    const seen = new Map<string, Set<string>>()
    for (const group of groups) {
      if (resolveMode(group) !== 'list') continue
      for (const value of group.values) {
        const label = value.label ?? value.value
        const keys = seen.get(label) ?? new Set<string>()
        keys.add(group.key)
        seen.set(label, keys)
      }
    }
    return (label: string) => (seen.get(label)?.size ?? 0) > 1
  }, [groups])

  const picked = groups
    .map((group) => ({ group, values: selection[group.key] ?? [] }))
    .filter((entry) => entry.values.length > 0)

  const count =
    picked.reduce((sum, entry) => sum + entry.values.length, 0) +
    queries.length +
    customFacets.length

  if (count === 0) return <p className="py-1 text-[11.5px] text-ink-soft">{emptyHint}</p>

  function labelFor(group: FacetGroup, value: string) {
    return group.values.find((option) => option.value === value)?.label ?? value
  }

  const chips: React.ReactNode[] = []

  for (const { group, values } of picked) {
    const folded = values.length >= FACET_CHIP_COLLAPSE_AT && !expandedGroups.includes(group.key)
    if (folded) {
      chips.push(
        <button
          key={group.key}
          type="button"
          onClick={() => setExpandedGroups((keys) => [...keys, group.key])}
          aria-expanded={false}
          className="flex items-center gap-1 rounded-full bg-chip py-1 pr-2 pl-2.5 text-[11.5px] font-semibold text-chip-fg transition hover:bg-chip-hover"
        >
          {group.label} · {values.length} of {group.cardinality ?? group.values.length}
          <ChevronDownIcon width={11} height={11} />
        </button>,
      )
      continue
    }
    for (const value of values) {
      const label = labelFor(group, value)
      chips.push(
        <FilterChip
          key={`${group.key}:${value}`}
          tone="value"
          prefix={ambiguous(label) ? group.label : undefined}
          label={label}
          onRemove={() => onRemoveValue(group.key, value)}
          removeLabel={`Remove the ${group.label} ${label} filter`}
        />,
      )
    }
  }

  for (const query of queries) {
    const group = groups.find((candidate) => candidate.key === query.groupKey)
    chips.push(
      <FilterChip
        key={`${query.groupKey}:${query.query}`}
        tone="query"
        prefix={`${group?.label ?? query.groupKey} contains`}
        label={query.query}
        count={typeof query.count === 'number' ? query.count : undefined}
        onRemove={() => onRemoveQuery?.(query)}
        removeLabel={`Remove the ${query.query} search filter`}
      />,
    )
  }

  for (const facet of customFacets) {
    chips.push(
      <FilterChip
        key={facet.id}
        tone="custom"
        prefix={facet.type}
        label={facet.value}
        onRemove={() => onRemoveCustom?.(facet.id)}
        removeLabel={`Remove the ${facet.type} ${facet.value} filter`}
      />,
    )
  }

  const overflow = maxChips !== undefined && !showAll && chips.length > maxChips
  const shown = overflow ? chips.slice(0, maxChips) : chips

  return (
    <div>
      <div className="mb-1.5 flex items-baseline gap-2">
        <p className="flex-1 text-[10px] font-semibold tracking-[0.12em] text-ink-soft uppercase">
          {title} · {count}
        </p>
        <button
          type="button"
          onClick={onClearAll}
          className="text-[11px] font-semibold text-brand-fg transition hover:text-brand-fg-hover"
        >
          {clearAllLabel}
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {shown}
        {overflow && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="rounded-full bg-panel px-2 py-1 text-[11px] font-semibold text-brand-fg transition hover:text-brand-fg-hover"
          >
            +{chips.length - maxChips} more
          </button>
        )}
        {picked
          .filter((entry) => expandedGroups.includes(entry.group.key))
          .map(({ group }) => (
            <button
              key={`${group.key}:fold`}
              type="button"
              onClick={() => {
                setExpandedGroups((keys) => keys.filter((key) => key !== group.key))
                onClearGroup(group.key)
              }}
              className="rounded-full px-2 py-1 text-[11px] font-semibold text-brand-fg transition hover:text-brand-fg-hover"
            >
              Clear {group.label}
            </button>
          ))}
      </div>
    </div>
  )
}
