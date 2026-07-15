import { MODEL_NAME } from '../config'
import { ChevronDownIcon, MenuIcon } from './Icons'
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
      <ThemeToggle />
    </header>
  )
}
