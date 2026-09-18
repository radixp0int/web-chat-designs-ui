// The right-hand panel's frame: a title, a close button, and whatever is being
// looked at. Shared by the step and stage views so the two cannot drift apart.
import { XIcon } from '../../../lib/components/icons'
import { IconButton } from '../../../lib/components/icon-button'

export function PanelShell({
  title,
  onClose,
  actions,
  children,
}: {
  title: string
  onClose: () => void
  /** Controls placed before the close button. Navigation, not content actions. */
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <aside className="flex h-full w-full flex-col border-l border-line bg-panel-solid/45">
      <div className="flex items-center gap-2.5 border-b border-line py-3 pr-3.5 pl-5">
        <span className="flex-1 text-[13px] font-bold text-ink-strong">{title}</span>
        {actions}
        <IconButton onClick={onClose} aria-label={`Hide ${title.toLowerCase()}`} title="Close">
          <XIcon width={14} height={14} />
        </IconButton>
      </div>
      {children}
    </aside>
  )
}
