import { APP_NAME } from '../config'
import { personas } from '../personas'
import {
  ChatIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LibraryIcon,
  SearchIcon,
  SlidersIcon,
  SparkleIcon,
  XIcon,
} from '../../lib/components/icons'
import { IconButton } from '../../lib/components/icon-button'

/**
 * Past conversations, grouped by the persona they were had with. A user is
 * entitled to some subset of the personas — this one has three of the four, so
 * Persona 4 never appears here. Names resolve from ../personas so renaming a
 * persona renames its group.
 *
 * Newest first within each group; `when` is a short relative age because the
 * rail is too narrow for a full date.
 */
const history: { personaId: string; chats: { title: string; when: string }[] }[] = [
  {
    personaId: 'persona-1',
    chats: [
      { title: 'Retirement glide path', when: '2d' },
      { title: 'College fund options', when: '5d' },
      { title: '529 vs custodial account', when: '1w' },
    ],
  },
  {
    personaId: 'persona-2',
    chats: [
      { title: 'Cash flow forecast', when: '3d' },
      { title: 'Line of credit questions', when: '2w' },
    ],
  },
  {
    personaId: 'persona-3',
    chats: [{ title: 'Quarterly tax estimates', when: '3w' }],
  },
]

type SidebarProps = {
  open: boolean
  /** Desktop-only slim icon-rail state (ignored below the `lg` breakpoint). */
  collapsed: boolean
  onToggleCollapse: () => void
  onClose: () => void
  onNewChat: () => void
  /** Opens the demo-features modal. The host app owns this menu, so it only
   *  contributes the entry point — the features themselves live in the chat. */
  onOpenDemoFeatures: () => void
}

export function Sidebar({
  open,
  collapsed,
  onToggleCollapse,
  onClose,
  onNewChat,
  onOpenDemoFeatures,
}: SidebarProps) {
  return (
    <>
      {/* Mobile scrim */}
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-scrim/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`glass fixed inset-y-0 left-0 z-40 flex w-72 flex-col rounded-r-xl transition-[transform,width] duration-300 lg:static lg:z-auto lg:translate-x-0 lg:rounded-xl ${
          collapsed ? 'lg:w-16' : 'lg:w-72'
        } ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Collapsed rail is too narrow for orb + toggle side by side, so the
            header stacks vertically in that state. */}
        <div
          className={`flex items-center gap-2.5 px-5 pt-5 pb-4 ${
            collapsed ? 'lg:flex-col lg:gap-3 lg:px-3' : ''
          }`}
        >
          <span className="orb block size-7 shrink-0 rounded-full" aria-hidden />
          <span
            className={`text-lg font-semibold tracking-tight text-ink-strong ${
              collapsed ? 'lg:hidden' : ''
            }`}
          >
            {APP_NAME}
          </span>
          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`hidden rounded-lg p-1.5 text-ink-soft hover:text-ink-strong lg:block ${
              collapsed ? '' : 'ml-auto'
            }`}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </button>
          {/* Mobile close — touch-only, so it takes the 44px variant. */}
          <IconButton
            size="lg"
            shape="rounded"
            onClick={onClose}
            className="ml-auto lg:hidden"
            aria-label="Close sidebar"
          >
            <XIcon />
          </IconButton>
        </div>

        <div className={`px-4 ${collapsed ? 'lg:px-3' : ''}`}>
          <button
            type="button"
            onClick={onNewChat}
            title="New chat"
            className={`flex w-full items-center gap-2.5 rounded-lg bg-panel-solid px-4 py-3 text-sm font-semibold text-ink-strong shadow-sm ring-1 ring-line transition hover:shadow-md hover:ring-accent/40 ${
              collapsed ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            <ChatIcon className="shrink-0 text-accent" />
            <span className={collapsed ? 'lg:hidden' : ''}>New chat</span>
          </button>
        </div>

        <nav
          className={`mt-4 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-4 pb-5 ${
            collapsed ? 'lg:px-3' : ''
          }`}
        >
          <SidebarLink icon={<SearchIcon />} label="Search chat" collapsed={collapsed} />
          <SidebarLink icon={<LibraryIcon />} label="Library" collapsed={collapsed} />

          {/* Recent conversations — too detailed for the slim rail, so hidden
              when collapsed. Each persona owns its own branch of history, so
              every group carries its own spine rather than sharing one. */}
          <div className={collapsed ? 'lg:hidden' : ''}>
            <div className="mt-5 mb-1 px-2">
              <span className="text-[11px] font-semibold tracking-[0.14em] text-ink-soft uppercase">
                Recent
              </span>
            </div>

            {history.map(({ personaId, chats }) => {
              const persona = personas.find((p) => p.id === personaId)
              if (!persona) return null
              return (
                <div key={personaId} className="mb-1.5">
                  {/* The persona names the group; the conversations are what you
                      act on, so this is a heading and not a button. */}
                  <h3
                    title={persona.hint}
                    className="flex items-center gap-2.5 px-2 py-2 text-sm font-medium text-ink"
                  >
                    <SparkleIcon className="shrink-0 text-accent" width={17} height={17} />
                    <span className="truncate">{persona.name}</span>
                  </h3>
                  <ul className="ml-[13px] border-l border-ink-soft/25 pl-4">
                    {chats.map(({ title, when }) => (
                      <li key={title}>
                        <button
                          type="button"
                          title={title}
                          className="group flex w-full items-baseline gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-panel"
                        >
                          <span className="min-w-0 flex-1 truncate text-[13px] text-ink-soft transition group-hover:text-ink">
                            {title}
                          </span>
                          <span className="shrink-0 text-[11px] text-ink-soft/70">{when}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        </nav>

        {/* The slim rail is too narrow for the profile and the demo control side
            by side, so the footer stacks there — same trick as the header. */}
        <div className={`border-t border-line px-5 py-4 ${collapsed ? 'lg:px-3' : ''}`}>
          <div className={`flex items-center gap-3 ${collapsed ? 'lg:flex-col lg:gap-2.5' : ''}`}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-solid text-xs font-bold text-on-brand-solid">
              JO
            </span>
            <div className={`min-w-0 text-[13px] leading-tight ${collapsed ? 'lg:hidden' : ''}`}>
              <div className="truncate font-semibold text-ink-strong">John Ozzo</div>
              <div className="truncate text-ink-soft">Performance plan</div>
            </div>
            <button
              type="button"
              onClick={onOpenDemoFeatures}
              aria-label="Demo features"
              title="Demo features"
              className={`shrink-0 rounded-lg p-1.5 text-ink-soft transition hover:bg-panel hover:text-ink-strong ${
                collapsed ? 'lg:ml-0' : 'ml-auto'
              }`}
            >
              <SlidersIcon width={17} height={17} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

function SidebarLink({
  icon,
  label,
  collapsed,
}: {
  icon: React.ReactNode
  label: string
  collapsed: boolean
}) {
  return (
    <button
      type="button"
      title={label}
      className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-sm font-medium text-ink transition hover:bg-panel ${
        collapsed ? 'lg:justify-center' : ''
      }`}
    >
      <span className="shrink-0 text-ink-soft">{icon}</span>
      <span className={collapsed ? 'lg:hidden' : ''}>{label}</span>
    </button>
  )
}
