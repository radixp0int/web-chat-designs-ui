// Demo data behind the widget's side-rail tabs — UI only for now.

/** One active filter/facet chip shown in the Filters side tab. */
export type ActiveFilter = {
  id: string
  group: string
  label: string
}

/** Demo facets — stands in for whatever search/context filters apply. */
export const demoFilters: ActiveFilter[] = [
  { id: 'acct-checking', group: 'Accounts', label: 'Everyday Checking' },
  { id: 'acct-savings', group: 'Accounts', label: 'High-Yield Savings' },
  { id: 'range-30d', group: 'Date range', label: 'Last 30 days' },
  { id: 'cat-groceries', group: 'Categories', label: 'Groceries' },
  { id: 'cat-dining', group: 'Categories', label: 'Dining out' },
  { id: 'cat-travel', group: 'Categories', label: 'Travel' },
]

export type RecentChat = {
  id: string
  title: string
  snippet: string
  when: string
}

/** Demo history — the switch is UI only for now. */
export const demoRecentChats: RecentChat[] = [
  {
    id: 'current',
    title: 'Monthly budget plan',
    snippet: 'Start with your monthly surplus — income after fixed costs…',
    when: 'Active now',
  },
  {
    id: 'emergency-fund',
    title: 'Emergency fund strategy',
    snippet: 'An emergency fund is the foundation of a resilient budget…',
    when: '12 July',
  },
  {
    id: 'first-home',
    title: 'First-home budget check',
    snippet: 'A comfortable mortgage payment usually stays under…',
    when: '10 July',
  },
  {
    id: 'side-income',
    title: 'Side-income tax basics',
    snippet: 'This blend of strategy and record-keeping keeps quarterly…',
    when: '8 July',
  },
]
