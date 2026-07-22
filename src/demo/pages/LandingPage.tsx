import { Link } from 'react-router'
import { ChatIcon, ChevronRightIcon, SparkleIcon } from '../../lib/components/icons'
import { ThemeToggle } from '../components/ThemeToggle'
import { APP_NAME } from '../config'

const demos = [
  {
    to: '/chat',
    icon: ChatIcon,
    title: 'Full chat experience',
    body: 'The full-page assistant — sidebar, streaming answers, inline citations with a reference reader, and switchable personas.',
  },
  {
    to: '/widget-demo',
    icon: SparkleIcon,
    title: 'Embedded widget',
    body: 'The same chat as a floating widget dropped onto a host page with a single script tag — shadow-DOM isolated and theme-synced.',
  },
]

/** Simple entry page linking to the two demos. */
export function LandingPage() {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      <AmbientGlow />

      <div className="absolute top-5 right-5">
        <ThemeToggle />
      </div>

      <main className="mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <span className="orb block size-16 rounded-full animate-orb-drift" aria-hidden />
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-(--text-strong) sm:text-4xl">
          {APP_NAME}
        </h1>
        <p className="mt-2 text-base text-(--text-soft)">Two ways to see the chat UI.</p>

        <div className="mt-10 grid w-full gap-4 sm:grid-cols-2">
          {demos.map(({ to, icon: Icon, title, body }) => (
            <Link
              key={to}
              to={to}
              className="glass group flex flex-col rounded-3xl p-6 text-left transition hover:-translate-y-0.5 hover:border-accent-500/40 hover:shadow-lg hover:shadow-brand-600/10"
            >
              <span className="flex size-11 items-center justify-center rounded-2xl bg-brand-600/8 text-brand-600 dark:bg-brand-300/12 dark:text-brand-200">
                <Icon width={20} height={20} className="text-accent-500" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-(--text-strong)">{title}</h2>
              <p className="mt-1.5 flex-1 text-sm leading-relaxed text-(--text-soft)">{body}</p>
              <span className="mt-4 flex items-center gap-1 text-sm font-semibold text-accent-600 dark:text-accent-400">
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
      </main>
    </div>
  )
}

/** Soft brand-colored wash bleeding in from the page corners. */
function AmbientGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10"
      style={{
        background: `radial-gradient(60rem 40rem at 80% -10%, var(--canvas-glow-a), transparent 60%),
          radial-gradient(50rem 35rem at -10% 110%, var(--canvas-glow-b), transparent 60%)`,
      }}
    />
  )
}
