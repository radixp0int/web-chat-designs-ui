// Canned assistant turns for the design mockup — cycled in order.
import type { CannedTurn } from './lib/chatEngine'

export const cannedTurns: CannedTurn[] = [
  {
    thinking:
      'The user is asking a personal-finance question. I should ground the answer in their stated goal, keep the math simple, and end with one concrete next step rather than a wall of options.\nKey factors: monthly cash flow, timeline, and how liquid the money needs to stay.',
    content:
      'Here is a straightforward way to think about it.\n\nStart with your monthly surplus — income after fixed costs and typical spending. Whatever that number is, automating a transfer on payday matters more than the exact amount, because consistency beats optimization at this stage.\n\nA practical split many people use:\n\n1. Keep one month of expenses in checking as a buffer.\n2. Direct new savings to a high-yield account until you reach your target.\n3. Only after that, route the overflow toward investing or extra debt payments.\n\nIf you share your monthly surplus and target date, I can turn this into a specific schedule with milestones.',
  },
  {
    thinking:
      'This is a planning request. A good plan needs a measurable target, a timeline, and checkpoints — I should propose defaults the user can adjust instead of asking too many questions up front.',
    content:
      'A plan works best when it has three parts: a target, a cadence, and checkpoints.\n\nTarget — define done. Pick the number or outcome you want and write it down; vague goals quietly expand.\n\nCadence — make it automatic. A fixed transfer or recurring block of time every week removes the daily decision entirely.\n\nCheckpoints — review monthly, not daily. Once a month, compare where you are against where the plan says you should be, and adjust the cadence rather than the target.\n\nWant me to draft this as a month-by-month table you can track against?',
  },
  {
    thinking:
      'The user wants ideas. Brainstorms are most useful when the options are genuinely different from each other, not five variations of one idea. I will group by effort level so they can pick based on energy, not just appeal.',
    content:
      'Here are a few directions, grouped by how much effort they take.\n\nQuick wins (this week): audit subscriptions and cancel anything unused for 60 days; switch one recurring bill to an annual plan for the discount.\n\nMedium lift (this month): set a per-category spending cap in your banking app and turn on alerts; renegotiate one fixed bill — internet and insurance respond well to a single call.\n\nBigger swings (this quarter): consolidate accounts so every dollar has one home, then automate the flow between them.\n\nI can go deeper on any of these — the subscription audit is usually the fastest payoff.',
  },
]
