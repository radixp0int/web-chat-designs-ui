import { BulbIcon, ImageIcon, PlanIcon, SummarizeIcon } from '../../lib/components/icons'

const suggestions = [
  {
    icon: ImageIcon,
    label: 'Create image',
    prompt: 'Create an image of a sunrise over a city skyline in warm orange and deep blue tones',
  },
  {
    icon: SummarizeIcon,
    label: 'Summarize text',
    prompt: 'Summarize the key points of my last quarterly budget review',
  },
  {
    icon: BulbIcon,
    label: 'Brainstorm ideas',
    prompt: 'Brainstorm ideas for reducing my monthly subscription spending',
  },
  {
    icon: PlanIcon,
    label: 'Make a plan',
    prompt: 'Make a 12-month savings plan for a $15,000 emergency fund',
  },
]

const recentChats = [
  {
    title: 'Emergency fund strategy',
    excerpt: 'An emergency fund is the foundation of a resilient budget, not ju…',
    date: '12 July',
  },
  {
    title: 'First-home budget check',
    excerpt: 'A comfortable mortgage payment usually stays under 28% of gro…',
    date: '10 July',
  },
  {
    title: 'Side-income tax basics',
    excerpt: 'This blend of strategy and record-keeping keeps quarterly estima…',
    date: '8 July',
  },
]

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function Hero() {
  return (
    <div className="flex flex-col items-center">
      <span className="orb block size-16 rounded-full animate-orb-drift" aria-hidden />

      <h1 className="mt-8 text-center text-4xl font-bold tracking-tight text-ink-strong sm:text-5xl">
        {greeting()}, Joe
      </h1>
      <p className="mt-3 text-lg text-ink-soft">How can I help you today?</p>
    </div>
  )
}

export function HeroSuggestions({ onPrompt }: { onPrompt: (text: string) => void }) {
  return (
    <>
      <div className="flex flex-wrap justify-center gap-2.5">
        {suggestions.map(({ icon: Icon, label, prompt }) => (
          <button
            key={label}
            type="button"
            onClick={() => onPrompt(prompt)}
            className="glass flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-semibold text-ink transition hover:border-accent/50 hover:text-ink-strong"
          >
            <Icon width={15} height={15} className="text-brand-fg" />
            {label}
          </button>
        ))}
      </div>

      <section className="mt-12 w-full">
        <h2 className="mb-4 text-sm font-semibold text-ink-soft">Your recent chats</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {recentChats.map((chat) => (
            <button
              key={chat.title}
              type="button"
              onClick={() => onPrompt(`Continue our chat about: ${chat.title}`)}
              className="glass group rounded-2xl p-4 text-left transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-(color:--shadow-raised)"
            >
              <h3 className="text-[15px] font-semibold text-ink-strong">{chat.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-ink-soft">
                {chat.excerpt}
              </p>
              <time className="mt-3 block text-xs text-ink-soft/80">{chat.date}</time>
            </button>
          ))}
        </div>
      </section>
    </>
  )
}
