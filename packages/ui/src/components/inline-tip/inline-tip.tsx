import { XIcon } from '../icons'
import { IconButton } from '../icon-button'
import { useUiSize } from '../../uiSize'
import type { InlineTipProps } from './types'

/**
 * A small, dismissible callout for surfacing one piece of product knowledge
 * right where it's relevant — never a modal, never a tour. Generic on
 * purpose: pair it with `useDismissableTip` under a surface-specific key
 * (see the citation-discovery tip in ChatMessage) for any "here's how this
 * works" moment worth saying once and then staying out of the way — scope
 * changes, retry behavior, whatever comes next — rather than growing a new
 * one-off banner per feature.
 */
export function InlineTip({
  icon,
  children,
  onDismiss,
  dismissLabel = 'Dismiss tip',
}: InlineTipProps) {
  const compact = useUiSize() === 'compact'

  return (
    <div
      role="note"
      className={`flex items-start gap-2.5 rounded-lg border border-brand-fg/20 bg-brand-fg/6 ${
        compact ? 'px-2.5 py-2' : 'px-3 py-2.5'
      }`}
    >
      {icon && (
        <span className="mt-0.5 shrink-0 text-brand-fg" aria-hidden>
          {icon}
        </span>
      )}
      <p className={`flex-1 leading-relaxed text-ink ${compact ? 'text-xs' : 'text-[12.5px]'}`}>
        {children}
      </p>
      {onDismiss && (
        <IconButton
          onClick={onDismiss}
          aria-label={dismissLabel}
          title={dismissLabel}
          size={compact ? 'sm' : 'md'}
          className="-my-1"
        >
          <XIcon width={13} height={13} />
        </IconButton>
      )}
    </div>
  )
}
