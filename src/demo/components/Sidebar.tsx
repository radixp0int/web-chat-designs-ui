import { APP_NAME } from '../config'
import {
  ChatIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FolderIcon,
  LibraryIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from '../../lib/components/Icons'

const folders = [
  {
    name: 'Wealth Planning',
    tint: 'text-accent-500',
    chats: ['Retirement glide path', 'College fund options', '529 vs custodial account'],
  },
  {
    name: 'Small Business',
    tint: 'text-brand-500 dark:text-brand-300',
    chats: ['Cash flow forecast', 'Line of credit questions'],
  },
]

type SidebarProps = {
  open: boolean
  /** Desktop-only slim icon-rail state (ignored below the `lg` breakpoint). */
  collapsed: boolean
  onToggleCollapse: () => void
  onClose: () => void
  onNewChat: () => void
}

export function Sidebar({ open, collapsed, onToggleCollapse, onClose, onNewChat }: SidebarProps) {
  return (
    <>
      {/* Mobile scrim */}
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-brand-950/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        className={`glass fixed inset-y-0 left-0 z-40 flex w-72 flex-col rounded-r-3xl transition-[transform,width] duration-300 lg:static lg:z-auto lg:translate-x-0 lg:rounded-3xl ${
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
            className={`text-lg font-semibold tracking-tight text-(--text-strong) ${
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
            className={`hidden rounded-lg p-1.5 text-(--text-soft) hover:text-(--text-strong) lg:block ${
              collapsed ? '' : 'ml-auto'
            }`}
          >
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </button>
          {/* Mobile close */}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-(--text-soft) hover:text-(--text-strong) lg:hidden"
            aria-label="Close sidebar"
          >
            <XIcon />
          </button>
        </div>

        <div className={`px-4 ${collapsed ? 'lg:px-3' : ''}`}>
          <button
            type="button"
            onClick={onNewChat}
            title="New chat"
            className={`flex w-full items-center gap-2.5 rounded-2xl bg-(--panel-solid) px-4 py-3 text-sm font-semibold text-(--text-strong) shadow-sm ring-1 ring-(--panel-border) transition hover:shadow-md hover:ring-accent-500/40 ${
              collapsed ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            <ChatIcon className="shrink-0 text-accent-500" />
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

          {/* Folders — too detailed for the slim rail, so hidden when collapsed. */}
          <div className={collapsed ? 'lg:hidden' : ''}>
            <div className="mt-5 mb-1 flex items-center justify-between px-2">
              <span className="text-[11px] font-semibold tracking-[0.14em] text-(--text-soft) uppercase">
                Folders
              </span>
              <button
                type="button"
                className="rounded-md p-1 text-(--text-soft) transition hover:text-accent-500"
                aria-label="New folder"
              >
                <PlusIcon width={15} height={15} />
              </button>
            </div>

            {folders.map((folder) => (
              <div key={folder.name} className="mb-1.5">
                <button
                  type="button"
                  className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-sm font-medium text-(--text-body) transition hover:bg-(--panel)"
                >
                  <FolderIcon className={folder.tint} width={17} height={17} />
                  {folder.name}
                </button>
                <ul className="ml-[13px] border-l border-(--panel-border) pl-4">
                  {folder.chats.map((chat) => (
                    <li key={chat}>
                      <button
                        type="button"
                        className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-[13px] text-(--text-soft) transition hover:bg-(--panel) hover:text-(--text-body)"
                      >
                        {chat}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <div className={`border-t border-(--panel-border) px-5 py-4 ${collapsed ? 'lg:px-3' : ''}`}>
          <div className={`flex items-center gap-3 ${collapsed ? 'lg:justify-center' : ''}`}>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              JO
            </span>
            <div className={`min-w-0 text-[13px] leading-tight ${collapsed ? 'lg:hidden' : ''}`}>
              <div className="truncate font-semibold text-(--text-strong)">John Ozzo</div>
              <div className="truncate text-(--text-soft)">Performance plan</div>
            </div>
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
      className={`flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-sm font-medium text-(--text-body) transition hover:bg-(--panel) ${
        collapsed ? 'lg:justify-center' : ''
      }`}
    >
      <span className="shrink-0 text-(--text-soft)">{icon}</span>
      <span className={collapsed ? 'lg:hidden' : ''}>{label}</span>
    </button>
  )
}
