import { useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { Button } from '../../core/button'
import { Modal } from '../../core/modal'
import { TextInput } from '../../core/text-input'
import { useUiSize } from '../../uiSize'
import { IconButton } from '../icon-button'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MenuIcon,
  PinIcon,
  PlusIcon,
  SearchIcon,
} from '../icons'
import { Tooltip } from '../tooltip'
import type { NavigationDestination, NavigationProps } from './types'

/** Persistent route navigation. SideTabs remains the separate, dismissible tool-panel pattern. */
export function Navigation({
  mode = 'expanded',
  onModeChange,
  sections,
  activeId,
  pinnedIds,
  onPinnedIdsChange,
  onNavigate,
  menuOpen,
  onMenuOpenChange,
  className = '',
}: NavigationProps) {
  const compact = useUiSize() === 'compact'
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const activeSection = sections.find((section) =>
    section.destinations.some((destination) => destination.id === activeId),
  )
  const category =
    sections.find((section) => section.id === categoryId) ?? activeSection ?? sections[0]
  const destinations = sections.flatMap((section) => section.destinations)
  const pinned = [...new Set(pinnedIds)].flatMap((id) => {
    const destination = destinations.find((item) => item.id === id)
    return destination ? [destination] : []
  })
  const term = query.trim().toLocaleLowerCase()
  const results = sections.flatMap((section) =>
    section.destinations
      .filter((item) =>
        term
          ? [item.label, section.label, ...(item.keywords ?? [])]
              .join(' ')
              .toLocaleLowerCase()
              .includes(term)
          : section.id === category?.id,
      )
      .map((destination) => ({ destination, section })),
  )
  const openMenu = () => {
    setQuery('')
    setCategoryId(activeSection?.id ?? null)
    onMenuOpenChange(true)
  }
  const navigate = (event: MouseEvent<HTMLAnchorElement>, destination: NavigationDestination) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)
      return
    onNavigate?.(destination, event)
    onMenuOpenChange(false)
  }
  const linkClass = (id: string) =>
    `flex min-w-0 items-center gap-2.5 rounded-control px-3 ${compact ? 'py-2 text-xs' : 'py-2.5 text-[13px]'} transition ${
      id === activeId ? 'bg-chip font-semibold text-chip-fg' : 'text-ink hover:bg-tint/8'
    }`

  if (mode === 'hidden') return null

  return (
    <div
      className={`flex shrink-0 flex-col border-line bg-panel-solid text-ink sm:flex-row ${className}`}
    >
      <nav
        aria-label="Pinned navigation"
        className="flex flex-wrap items-center gap-1 border-b border-line bg-tint/3 p-2 sm:w-16 sm:flex-col sm:border-r sm:border-b-0"
      >
        <Tooltip content="All apps">
          <IconButton
            size="lg"
            shape="rounded"
            aria-label="All apps"
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            onClick={openMenu}
          >
            <MenuIcon width={19} height={19} />
          </IconButton>
        </Tooltip>
        <div className="hidden h-px w-8 bg-line sm:my-2 sm:block" />
        {pinned.map((destination) => (
          <Tooltip key={destination.id} content={destination.label}>
            <a
              href={destination.href}
              aria-label={destination.label}
              aria-current={destination.id === activeId ? 'page' : undefined}
              onClick={(event) => navigate(event, destination)}
              className={`grid size-11 place-items-center rounded-control transition [&_svg]:size-[18px] ${destination.id === activeId ? 'bg-chip text-chip-fg' : 'text-ink-soft hover:bg-tint/8 hover:text-ink-strong'}`}
            >
              <span aria-hidden="true">{destination.icon}</span>
            </a>
          </Tooltip>
        ))}
        <Tooltip content="Manage pinned destinations">
          <IconButton
            size="lg"
            shape="rounded"
            aria-label="Manage pinned destinations"
            aria-haspopup="dialog"
            onClick={openMenu}
          >
            <PlusIcon width={17} height={17} />
          </IconButton>
        </Tooltip>
        {onModeChange && (
          <Tooltip content={mode === 'expanded' ? 'Collapse navigation' : 'Expand navigation'}>
            <IconButton
              size="lg"
              shape="rounded"
              aria-label={mode === 'expanded' ? 'Collapse navigation' : 'Expand navigation'}
              aria-expanded={mode === 'expanded'}
              onClick={() => onModeChange(mode === 'expanded' ? 'rail' : 'expanded')}
            >
              {mode === 'expanded' ? (
                <ChevronLeftIcon width={18} height={18} />
              ) : (
                <ChevronRightIcon width={18} height={18} />
              )}
            </IconButton>
          </Tooltip>
        )}
      </nav>
      {mode === 'expanded' && (
        <nav
          aria-label="Section navigation"
          className={`w-full border-b border-line p-3 sm:border-r sm:border-b-0 ${compact ? 'sm:w-48' : 'sm:w-56'}`}
        >
          <Button
            variant="secondary"
            block
            icon={<SearchIcon width={15} height={15} />}
            onClick={openMenu}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
          >
            Go to…
          </Button>
          <h2 className="px-3 pt-6 pb-3 text-[13px] font-semibold text-ink-strong">
            {activeSection?.label ?? 'Navigation'}
          </h2>
          <div className="flex flex-col gap-1">
            {activeSection?.destinations.map((destination) => (
              <a
                key={destination.id}
                href={destination.href}
                aria-current={destination.id === activeId ? 'page' : undefined}
                onClick={(event) => navigate(event, destination)}
                className={linkClass(destination.id)}
              >
                <span className="min-w-0 break-words">{destination.label}</span>
              </a>
            )) ?? <p className="px-3 text-xs text-ink-soft">Choose a destination from All apps.</p>}
          </div>
        </nav>
      )}
      <Modal
        open={menuOpen}
        onOpenChange={onMenuOpenChange}
        title="All apps"
        description="Find a destination or pin it for quick access."
        size="lg"
        initialFocusRef={searchRef}
      >
        <TextInput
          ref={searchRef}
          className="mb-4 w-full"
          aria-label="Search destinations"
          placeholder="Search all destinations…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          icon={<SearchIcon width={16} height={16} />}
          onClear={() => setQuery('')}
          clearLabel="Clear search"
        />
        <div className="flex min-h-64 flex-col gap-4 sm:flex-row">
          <nav
            aria-label="Navigation categories"
            className="flex flex-wrap gap-1 sm:w-40 sm:shrink-0 sm:flex-col"
          >
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                aria-pressed={!term && category?.id === section.id}
                onClick={() => {
                  setCategoryId(section.id)
                  setQuery('')
                }}
                className={`rounded-control px-3 py-2.5 text-left text-[13px] ${!term && category?.id === section.id ? 'bg-chip font-semibold text-chip-fg' : 'text-ink-soft hover:bg-tint/8'}`}
              >
                {section.label}
              </button>
            ))}
          </nav>
          <div className="min-w-0 flex-1 sm:border-l sm:border-line sm:pl-4">
            <p className="mb-2 text-xs text-ink-soft" role="status">
              {term ? `${results.length} destinations found` : (category?.label ?? 'Destinations')}
            </p>
            {results.length === 0 && (
              <p className="py-6 text-[13px] text-ink-soft">
                No destinations found. Try another search.
              </p>
            )}
            {results.map(({ destination, section }) => (
              <div key={destination.id} className="flex items-center gap-1 py-0.5">
                <a
                  href={destination.href}
                  aria-current={destination.id === activeId ? 'page' : undefined}
                  onClick={(event) => navigate(event, destination)}
                  className={`${linkClass(destination.id)} flex-1`}
                >
                  <span aria-hidden="true" className="shrink-0 [&_svg]:size-[18px]">
                    {destination.icon}
                  </span>
                  <span className="min-w-0 break-words">
                    {destination.label}
                    <span className="block text-xs font-normal text-ink-soft">{section.label}</span>
                  </span>
                </a>
                <Tooltip
                  content={
                    pinnedIds.includes(destination.id) ? 'Unpin destination' : 'Pin destination'
                  }
                >
                  <IconButton
                    size="lg"
                    shape="rounded"
                    active={pinnedIds.includes(destination.id)}
                    aria-pressed={pinnedIds.includes(destination.id)}
                    aria-label={`${pinnedIds.includes(destination.id) ? 'Unpin' : 'Pin'} ${destination.label}`}
                    onClick={() =>
                      onPinnedIdsChange(
                        pinnedIds.includes(destination.id)
                          ? pinnedIds.filter((id) => id !== destination.id)
                          : [...pinnedIds, destination.id],
                      )
                    }
                  >
                    <PinIcon width={16} height={16} />
                  </IconButton>
                </Tooltip>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
