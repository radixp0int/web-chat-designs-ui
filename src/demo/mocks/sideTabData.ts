// Demo data behind the widget's side-rail tabs — UI only for now.
import type { PromptTemplate, RecentChat } from '../../lib/types'
import { recentChats } from './recentChats'

// The widget's filter fixtures used to live here. They are gone: the Filters
// tab now renders the same FacetFilters component the full-page rail does,
// reading the counted index in ./facets.

/**
 * Demo history for the widget's Recent chats panel — the switch is UI only for
 * now. Derived from the shared list rather than a fourth copy of it, with the
 * live conversation pinned on top: the panel's job is to show what you can
 * switch back to, and the one you are in has to be in that list to be marked
 * active.
 */
export const demoRecentChats: RecentChat[] = [
  {
    id: 'current',
    title: 'Monthly liquidity position',
    snippet: 'Start with today’s available balance across the operating accounts…',
    when: 'Active now',
  },
  ...recentChats.map(({ id, title, snippet, when }) => ({ id, title, snippet, when })),
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
