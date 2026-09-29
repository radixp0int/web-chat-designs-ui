import { useMemo, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import {
  DATE_RANGES,
  FACET_TYPES,
  LOAN_COUNT,
  describeFacetType,
  queryFacets,
  searchLoans,
} from '../../__fixtures__/facets'
import { FacetFilters } from './facet-filters'
import type { CustomFacet, FacetFiltersProps, FacetQuery, FacetSelection } from './types'

const PAGE = 50

/**
 * The host every story renders: it owns the selection, the scope, the query
 * chips and the custom facets, and answers the component's callbacks against
 * the fixture index — exactly what a real host does against `/facets`.
 */
function Host(props: Partial<FacetFiltersProps>) {
  const [selection, setSelection] = useState<FacetSelection>({ accounts: ['ops', 'pay'] })
  const [days, setDays] = useState('90')
  const [queries, setQueries] = useState<FacetQuery[]>([])
  const [custom, setCustom] = useState<CustomFacet[]>([])
  const [loanQuery, setLoanQuery] = useState('')
  const [loanLimit, setLoanLimit] = useState(PAGE)

  const facets = useMemo(
    () => queryFacets(selection, Number(days), queries),
    [selection, days, queries],
  )
  const lookup = useMemo(
    () => searchLoans(selection, Number(days), loanQuery, loanLimit, queries),
    [selection, days, loanQuery, loanLimit, queries],
  )

  return (
    <FacetFilters
      groups={[
        ...facets.groups,
        {
          key: 'loans',
          label: 'Loan Number',
          cardinality: LOAN_COUNT,
          values: lookup.values,
          loaded: lookup.loaded,
          matchCount: lookup.matchCount,
          hasMore: lookup.hasMore,
        },
      ]}
      selection={selection}
      onSelectionChange={setSelection}
      total={facets.total}
      scope={{
        label: 'Date range',
        value: days,
        options: DATE_RANGES,
        onChange: setDays,
      }}
      facetTypes={FACET_TYPES}
      describeFacetType={describeFacetType}
      customFacets={custom}
      onAddCustomFacet={(f) => setCustom((c) => [...c, { ...f, id: `${f.type}-${c.length}` }])}
      onRemoveCustomFacet={(id) => setCustom((c) => c.filter((f) => f.id !== id))}
      queries={queries}
      onAddQuery={(q) => setQueries((list) => [...list, q])}
      onRemoveQuery={(q) =>
        setQueries((list) => list.filter((x) => x.groupKey !== q.groupKey || x.query !== q.query))
      }
      onSearchGroup={(key, query) => {
        if (key !== 'loans') return
        setLoanQuery(query)
        setLoanLimit(PAGE)
      }}
      onLoadMore={() => setLoanLimit((n) => n + PAGE)}
      onLoadAll={() => setLoanLimit(LOAN_COUNT)}
      pageSize={PAGE}
      onClearAll={() => {
        setSelection({})
        setQueries([])
        setCustom([])
      }}
      defaultOpen
      {...props}
    />
  )
}

const meta = {
  title: 'Primitives/Components/FacetFilters',
  component: FacetFilters,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[19rem] rounded-surface border border-line bg-panel-solid">{Story()}</div>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          'The Filters section of a side rail. Controlled end to end — it fetches nothing, counts nothing and stores nothing, so a live `/facets` endpoint and this story’s fixture satisfy the same props. Groups past `FACET_LOOKUP_THRESHOLD` values switch from a list to a lookup; select-all past `selectAllCap` offers a query chip instead of enumerating.',
      },
    },
  },
} satisfies Meta<typeof FacetFilters>

export default meta
type Story = StoryObj<typeof FacetFilters>

export const Comfortable: Story = { render: () => <Host /> }

/** The widget's panel: fewer groups open, shorter previews, a Done bar. */
export const Compact: Story = {
  render: () => <Host density="compact" showHeader={false} onDone={fn()} />,
}

/** Counts blank to a bar while a refetch is in flight; rows stay clickable. */
export const Refreshing: Story = { render: () => <Host refreshing /> }

/** The facet call failed: counts become em dashes and Retry appears. */
export const FetchError: Story = {
  render: () => <Host error="The facet service did not respond." onRetry={fn()} />,
}

/** The sidebar is a slim icon rail — only the entry point renders. */
export const RailCollapsed: Story = {
  decorators: [(Story) => <div className="w-12">{Story()}</div>],
  render: () => <Host railCollapsed onExpandRail={fn()} />,
}
