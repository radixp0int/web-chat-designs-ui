import { Link } from 'react-router'
import {
  ChatIcon,
  ChevronRightIcon,
  HistoryIcon,
  PlanIcon,
  SparkleIcon,
} from '../../lib/components/icons'
import { ThemeToggle } from '../components/ThemeToggle'
import { APP_NAME } from '../config'
import { AmbientGlow } from '../components/AmbientGlow'

const demos = [
  {
    to: '/chat',
    icon: ChatIcon,
    title: 'Full chat experience',
    body: 'The full-page assistant — sidebar, streaming answers, inline citations with a reference reader, daily suggested questions and chained queues.',
  },
  {
    to: '/widget-demo',
    icon: SparkleIcon,
    title: 'Embedded widget',
    body: 'The same chat as a floating widget dropped onto a host page with a single script tag — shadow-DOM isolated and theme-synced.',
  },
  {
    to: '/workflow-demo',
    icon: PlanIcon,
    title: 'Agentic workflow',
    body: 'A multi-step run that stops for a human approval — stage columns, a compact view for big runs, and nodes that simplify as you zoom out.',
  },
  {
    to: '/workflow-live',
    icon: HistoryIcon,
    title: 'Live workflow runs',
    body: 'The same canvas driven by a server: three different workflows stream in, the run log fills as work happens, and your approval goes back over the socket.',
  },
]

/** Simple entry page linking to each demo route. */
export function LandingPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <AmbientGlow />

      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <span className="orb block size-16 rounded-full animate-orb-drift" aria-hidden />
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-ink-strong sm:text-4xl">
          {APP_NAME}
        </h1>
        <p className="mt-2 text-base text-ink-soft">Ways to see the chat UI.</p>

        <div className="mt-10 grid w-full gap-4 sm:grid-cols-2">
          {demos.map(({ to, icon: Icon, title, body }) => (
            <Link
              key={to}
              to={to}
              className="glass group flex flex-col rounded-xl p-6 text-left transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-(color:--shadow-raised)"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-chip text-chip-fg">
                <Icon width={20} height={20} className="text-accent" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-ink-strong">{title}</h2>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-soft">{body}</p>
              <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-accent-fg">
                Open demo
                <ChevronRightIcon
                  width={16}
                  height={16}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          ))}
        </div>

        {/* Temporary — remove with src/demo/mermaid-lab/ once a renderer is chosen. */}
        <Link
          to="/mermaid-lab"
          className="glass mt-4 flex w-full items-center gap-3 rounded-2xl px-5 py-3.5 text-left transition hover:border-accent/40"
        >
          <PlanIcon width={18} height={18} className="shrink-0 text-accent" />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink-strong">
                Mermaid renderer bake-off
              </span>
              <span className="rounded-full bg-chip px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-chip-fg uppercase">
                Lab
              </span>
            </span>
            <span className="block text-xs text-ink-soft">
              Two diagram libraries side by side. Temporary — delete after we pick one.
            </span>
          </span>
          <ChevronRightIcon width={16} height={16} className="shrink-0 text-ink-soft" />
        </Link>
      </main>
    </div>
  )
}

/** Soft brand-colored wash bleeding in from the page corners. */
