import { useEffect } from 'react'
import { Link } from 'react-router'
import { ThemeToggle } from '../components/ThemeToggle'
import { init } from '../widget/embed'

// A deliberately un-Aristotle host page (serif type, forest-green palette):
// a fictional wealth firm embedding the chat widget, so the shadow-DOM style
// isolation and theme sync are visible against a foreign design.
const serif = { fontFamily: "Georgia, 'Times New Roman', serif" }

const services = [
  {
    title: 'Portfolio stewardship',
    body: 'Long-horizon allocations reviewed quarterly, rebalanced only when drift earns it.',
  },
  {
    title: 'Retirement design',
    body: 'Income floors, withdrawal sequencing, and the tax seams between accounts.',
  },
  {
    title: 'Next-generation planning',
    body: 'Trusts, gifting schedules, and the family conversations that make them stick.',
  },
]

export function WidgetDemoPage() {
  // Mount the widget exactly the way an embedding site would — same init()
  // the script tag calls — and tear it down when leaving the route.
  useEffect(() => {
    const handle = init({ theme: 'auto' })
    return () => handle.destroy()
  }, [])

  return (
    <div className="min-h-dvh bg-[#f6f4ee] text-[#212b24] dark:bg-[#0f1713] dark:text-[#e6ece7]">
      <header className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-5">
        <span style={serif} className="text-xl font-bold tracking-tight">
          Alder&thinsp;&amp;&thinsp;Finch
        </span>
        <span className="hidden text-xs tracking-[0.2em] text-[#5c6b5f] uppercase sm:block dark:text-[#93a496]">
          Private wealth counsel
        </span>
        <nav className="ml-auto flex items-center gap-4 text-sm">
          <Link to="/" className="underline-offset-4 hover:underline">
            Full chat demo
          </Link>
          <ThemeToggle />
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6">
        <section className="border-y border-[#212b24]/15 py-16 sm:py-24 dark:border-[#e6ece7]/15">
          <p className="text-xs font-semibold tracking-[0.25em] text-[#2f5d46] uppercase dark:text-[#7fb69a]">
            Established 1987
          </p>
          <h1 style={serif} className="mt-4 max-w-2xl text-4xl leading-tight sm:text-6xl">
            Quiet counsel for money that intends to outlast you.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-[#4a584d] dark:text-[#a9b8ac]">
            We manage portfolios for two hundred families, most of whom found us the same way you
            did — through someone who never planned to leave. Questions? The assistant in the corner
            is our Aristotle concierge, embedded with a single script tag.
          </p>
        </section>

        <section className="border-b border-[#212b24]/15 py-12 dark:border-[#e6ece7]/15">
          <h2 style={serif} className="text-xl">
            Client portal
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#4a584d] dark:text-[#a9b8ac]">
            The assistant reads these fields straight from this page. Edit them and watch the chat
            header and greeting update — no API, just the widget querying the host DOM.
          </p>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-6 grid max-w-xl gap-4 sm:grid-cols-2"
          >
            <label className="flex flex-col gap-1.5 text-xs font-semibold tracking-wide text-[#5c6b5f] uppercase dark:text-[#93a496]">
              Account holder
              <input
                type="text"
                data-aristotle-profile="name"
                defaultValue="Secretariat"
                autoComplete="off"
                className="rounded-md border border-[#212b24]/20 bg-white/70 px-3 py-2 text-sm font-normal tracking-normal text-[#212b24] normal-case outline-none focus:border-[#2f5d46] dark:border-[#e6ece7]/20 dark:bg-white/5 dark:text-[#e6ece7]"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-xs font-semibold tracking-wide text-[#5c6b5f] uppercase dark:text-[#93a496]">
              Login ID
              <input
                type="text"
                data-aristotle-profile="id"
                defaultValue="AB12345"
                pattern="[A-Za-z]{2}[0-9]{5}"
                autoComplete="off"
                className="rounded-md border border-[#212b24]/20 bg-white/70 px-3 py-2 text-sm font-normal tracking-normal text-[#212b24] normal-case outline-none focus:border-[#2f5d46] dark:border-[#e6ece7]/20 dark:bg-white/5 dark:text-[#e6ece7]"
              />
            </label>
          </form>
        </section>

        <section className="grid gap-px bg-[#212b24]/15 sm:grid-cols-3 dark:bg-[#e6ece7]/15">
          {services.map((s) => (
            <article key={s.title} className="bg-[#f6f4ee] py-8 pr-8 dark:bg-[#0f1713]">
              <h2 style={serif} className="text-xl">
                {s.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#4a584d] dark:text-[#a9b8ac]">
                {s.body}
              </p>
            </article>
          ))}
        </section>

        <footer className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-[#212b24]/15 py-10 text-xs text-[#5c6b5f] dark:border-[#e6ece7]/15 dark:text-[#93a496]">
          <span>Alder &amp; Finch is a fictional firm on a demo page.</span>
          <span>
            The chat bubble (bottom right) is the embedded Aristotle widget — it keeps its own fonts
            and styles inside a shadow root and follows this page&apos;s theme.
          </span>
        </footer>
      </main>
    </div>
  )
}
