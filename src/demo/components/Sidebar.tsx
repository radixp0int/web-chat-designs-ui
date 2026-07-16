import { APP_NAME } from '../config'
import {
  ChatIcon,
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
  onClose: () => void
  onNewChat: () => void
}

export function Sidebar({ open, onClose, onNewChat }: SidebarProps) {
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
        className={`glass fixed inset-y-0 left-0 z-40 flex w-72 flex-col rounded-r-3xl transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0 lg:rounded-3xl ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
          <span className="orb block size-7 rounded-full" aria-hidden />
          <span className="text-lg font-semibold tracking-tight text-(--text-strong)">
            {APP_NAME}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg p-1.5 text-(--text-soft) hover:text-(--text-strong) lg:hidden"
            aria-label="Close sidebar"
          >
            <XIcon />
          </button>
        </div>

        <div className="px-4">
          <button
            type="button"
            onClick={onNewChat}
            className="flex w-full items-center gap-2.5 rounded-2xl bg-(--panel-solid) px-4 py-3 text-sm font-semibold text-(--text-strong) shadow-sm ring-1 ring-(--panel-border) transition hover:shadow-md hover:ring-accent-500/40"
          >
            <ChatIcon className="text-accent-500" />
            New chat
          </button>
        </div>

        <nav className="mt-4 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-4 pb-5">
          <SidebarLink icon={<SearchIcon />} label="Search chat" />
          <SidebarLink icon={<LibraryIcon />} label="Library" />

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
        </nav>

        <div className="border-t border-(--panel-border) px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-8 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
              JO
            </span>
            <div className="min-w-0 text-[13px] leading-tight">
              <div className="truncate font-semibold text-(--text-strong)">John Ozzo</div>
              <div className="truncate text-(--text-soft)">Performance plan</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

function SidebarLink({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-sm font-medium text-(--text-body) transition hover:bg-(--panel)"
    >
      <span className="text-(--text-soft)">{icon}</span>
      {label}
    </button>
  )
}
