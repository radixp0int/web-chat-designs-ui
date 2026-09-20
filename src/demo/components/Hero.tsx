import { BulbIcon, ImageIcon, PlanIcon, SummarizeIcon } from '../../lib/components/icons'
import { recentChats } from '../mocks/recentChats'

const suggestions = [
  {
    icon: ImageIcon,
    label: 'Create image',
    prompt:
      'Create an illustration of a treasury workstation at sunrise, in warm orange and deep blue tones',
  },
  {
    icon: SummarizeIcon,
    label: 'Summarize text',
    prompt: 'Summarize the key points of last month’s account analysis statement',
  },
  {
    icon: BulbIcon,
    label: 'Brainstorm ideas',
    prompt: 'Brainstorm ways to cut days sales outstanding on our receivables',
  },
  {
    icon: PlanIcon,
    label: 'Make a plan',
    prompt: 'Make a plan to move our supplier payments from cheque to ACH over two quarters',
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
          {recentChats.slice(0, 3).map((chat) => (
            <button
              key={chat.title}
              type="button"
              onClick={() => onPrompt(`Continue our chat about: ${chat.title}`)}
              className="glass group rounded-lg p-4 text-left transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-(color:--shadow-raised)"
            >
              <h3 className="text-[15px] font-semibold text-ink-strong">{chat.title}</h3>
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-ink-soft">
                {chat.snippet}
              </p>
              <time className="mt-3 block text-xs text-ink-soft/80">{chat.date}</time>
            </button>
          ))}
        </div>
      </section>
    </>
  )
}
