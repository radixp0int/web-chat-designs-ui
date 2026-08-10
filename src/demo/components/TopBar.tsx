import { Link } from 'react-router'
import { ChatIcon, MenuIcon } from '../../lib/components/icons'
import { ThemeToggle } from './ThemeToggle'

export function TopBar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  return (
    <header className="flex items-center gap-3 px-5 py-4">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="rounded-lg p-1.5 text-ink-soft hover:text-ink-strong lg:hidden"
        aria-label="Open sidebar"
      >
        <MenuIcon />
      </button>
      <Link
        to="/widget-demo"
        title="See the embeddable widget demo"
        className="glass ml-auto flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-ink-soft transition hover:text-accent"
      >
        <ChatIcon width={16} height={16} />
        <span className="max-sm:hidden">Widget demo</span>
      </Link>
      <ThemeToggle />
    </header>
  )
}
