// Demo data behind the widget's side-rail tabs — UI only for now.
import type { ActiveFilter, PromptTemplate, RecentChat } from '../../lib/types'

/** Demo facets — stands in for whatever search/context filters apply. */
export const demoFilters: ActiveFilter[] = [
  { id: 'acct-checking', group: 'Accounts', label: 'Everyday Checking' },
  { id: 'acct-savings', group: 'Accounts', label: 'High-Yield Savings' },
  { id: 'range-30d', group: 'Date range', label: 'Last 30 days' },
  { id: 'cat-groceries', group: 'Categories', label: 'Groceries' },
  { id: 'cat-dining', group: 'Categories', label: 'Dining out' },
  { id: 'cat-travel', group: 'Categories', label: 'Travel' },
]

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

/** The prompt stack behind the widget's Persona side panel — read-only, UI only for now. */
export const demoPromptTemplates: PromptTemplate[] = [
  {
    id: 'base',
    priority: 1,
    label: 'Base persona',
    body: `You are Aristotle, a personal finance guide.

Answer in plain language, lead with the number that matters, and show the
arithmetic behind it. Close with the single next step worth taking this week.`,
  },
  {
    id: 'compliance',
    priority: 2,
    label: 'Compliance',
    body: `Never recommend a specific security, fund, or ticker. Frame every
projection as an estimate and name the assumption it rests on. If the question
needs a licensed advisor, say so plainly and stop there.`,
  },
  {
    id: 'session',
    priority: 3,
    label: 'Session context',
    body: `The reader is signed in and their accounts are in scope. Cite the
account or statement whenever one backs a claim, and prefer their own figures
over national averages.`,
  },
]
