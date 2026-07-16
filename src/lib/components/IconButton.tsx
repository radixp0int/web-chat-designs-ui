import type { ButtonHTMLAttributes } from 'react'

/**
 * Icon-only ghost button — the recurring control in the chat UI (header actions,
 * reference nav, message actions, panel close). Consolidates a Tailwind class
 * string that was previously copy-pasted across half a dozen components.
 *
 * `active` applies the accent tint used by toggle controls (e.g. the like/dislike
 * buttons). Disabled styling is always present but only shows when `disabled` is
 * set, so nav buttons at the ends of a list dim correctly.
 */
type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: 'sm' | 'md' | 'lg'
  shape?: 'circle' | 'rounded'
  active?: boolean
}

const sizePadding: Record<NonNullable<IconButtonProps['size']>, string> = {
  sm: 'p-1',
  md: 'p-1.5',
  lg: 'p-2',
}

const ghost =
  'text-(--text-soft) transition hover:bg-brand-600/8 hover:text-(--text-strong) disabled:pointer-events-none disabled:opacity-40 dark:hover:bg-white/8'

export function IconButton({
  size = 'md',
  shape = 'circle',
  active = false,
  type = 'button',
  className = '',
  children,
  ...rest
}: IconButtonProps) {
  const cls = [
    shape === 'circle' ? 'rounded-full' : 'rounded-lg',
    sizePadding[size],
    ghost,
    active ? 'text-accent-500' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  )
}
