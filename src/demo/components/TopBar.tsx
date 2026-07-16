import { Link } from 'react-router'
import { MODEL_NAME } from '../config'
import { ChatIcon, ChevronDownIcon, MenuIcon } from '../../lib/components/Icons'
import { ThemeToggle } from './ThemeToggle'

export function TopBar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  return (
    <header className="flex items-center gap-3 px-5 py-4">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="rounded-lg p-1.5 text-(--text-soft) hover:text-(--text-strong) lg:hidden"
        aria-label="Open sidebar"
      >
        <MenuIcon />
      </button>
      <button
        type="button"
        className="mx-auto flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-(--text-strong) transition hover:bg-brand-600/6 dark:hover:bg-white/6"
      >
        {MODEL_NAME}
        <ChevronDownIcon width={15} height={15} className="text-(--text-soft)" />
      </button>
      <Link
        to="/widget-demo"
        title="See the embeddable widget demo"
        className="glass flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-(--text-soft) transition hover:text-accent-500"
      >
        <ChatIcon width={16} height={16} />
        <span className="max-sm:hidden">Widget demo</span>
      </Link>
      <ThemeToggle />
    </header>
  )
}
