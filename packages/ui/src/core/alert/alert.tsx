import type { ReactNode } from 'react'
import {
  ChevronRightIcon,
  CircleCheckIcon,
  CircleInfoIcon,
  CircleXIcon,
  TriangleAlertIcon,
  XIcon,
} from '../../components/icons'
import { IconButton } from '../../components/icon-button'
import { useUiSize } from '../../uiSize'
import type { AlertProps, AlertTone } from './types'

const tones: Record<
  AlertTone,
  { frame: string; accentBorder: string; icon: string; glyph: ReactNode }
> = {
  info: {
    frame: 'border-brand-fg/25 bg-brand-fg/6',
    accentBorder: 'border-l-brand-fg',
    icon: 'text-brand-fg',
    glyph: <CircleInfoIcon width={17} height={17} />,
  },
  success: {
    frame: 'border-success-line bg-success-surface',
    accentBorder: 'border-l-success',
    icon: 'text-success-fg',
    glyph: <CircleCheckIcon width={17} height={17} />,
  },
  warning: {
    frame: 'border-caution-line bg-caution-surface',
    accentBorder: 'border-l-caution',
    icon: 'text-caution',
    glyph: <TriangleAlertIcon width={17} height={17} />,
  },
  error: {
    frame: 'border-danger/25 bg-danger/8',
    accentBorder: 'border-l-danger',
    icon: 'text-danger-fg',
    glyph: <CircleXIcon width={17} height={17} />,
  },
}

/**
 * A compact status message with enough structure for validation summaries,
 * retries and diagnostic payloads. Tone is never the only signal: each state
 * has its own glyph and callers provide a visible title.
 */
export function Alert({
  tone = 'info',
  title,
  bordered = false,
  children,
  items,
  action,
  onDismiss,
  dismissLabel = 'Dismiss alert',
  icon,
  details,
  detailsLabel = 'Show details',
  className = '',
  role = tone === 'error' ? 'alert' : 'status',
  ...rest
}: AlertProps) {
  const compact = useUiSize() === 'compact'
  const treatment = tones[tone]

  return (
    <div
      role={role}
      className={[
        'flex min-w-0 items-start gap-2.5 rounded-surface border',
        treatment.frame,
        bordered ? `border-l-[3px] ${treatment.accentBorder}` : '',
        compact ? 'px-2.5 py-2' : 'px-3 py-2.5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {icon !== false && (
        <span
          className={`mt-0.5 inline-grid shrink-0 place-items-center ${treatment.icon}`}
          aria-hidden
        >
          {icon ?? treatment.glyph}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p
          className={`font-bold leading-relaxed text-ink-strong ${compact ? 'text-xs' : 'text-[12.5px]'}`}
        >
          {title}
        </p>
        {children && (
          <div
            className={`mt-0.5 leading-relaxed text-ink ${compact ? 'text-xs' : 'text-[12.5px]'}`}
          >
            {children}
          </div>
        )}
        {items && items.length > 0 && (
          <ul
            className={`mt-1.5 list-disc space-y-0.5 pl-4.5 leading-relaxed text-ink ${compact ? 'text-xs' : 'text-[12.5px]'}`}
          >
            {items.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        )}
        {details && (
          <details className="group mt-2">
            <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-[12px] font-bold text-brand-fg hover:text-brand-fg-hover [&::-webkit-details-marker]:hidden">
              <ChevronRightIcon
                width={13}
                height={13}
                className="transition-transform group-open:rotate-90"
              />
              {detailsLabel}
            </summary>
            <div className="mt-2 min-w-0">{details}</div>
          </details>
        )}
      </div>

      {(action || onDismiss) && (
        <div className="flex shrink-0 items-center gap-1">
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              aria-label={action.ariaLabel}
              disabled={action.disabled}
              className="h-8 rounded-control px-2.5 text-[12px] font-bold text-brand-fg transition hover:bg-brand-fg/10 hover:text-brand-fg-hover disabled:pointer-events-none disabled:opacity-40"
            >
              {action.label}
            </button>
          )}
          {onDismiss && (
            <IconButton
              onClick={onDismiss}
              aria-label={dismissLabel}
              title={dismissLabel}
              size="sm"
              className="-my-1"
            >
              <XIcon width={13} height={13} />
            </IconButton>
          )}
        </div>
      )}
    </div>
  )
}
