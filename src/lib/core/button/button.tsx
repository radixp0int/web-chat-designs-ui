import type { ButtonProps, ButtonSize, ButtonVariant } from './types'

/**
 * Heights, not padding — the same rule `IconButton` encodes, for the same
 * reason: a target's size must not depend on what the caller put inside it.
 *
 *   sm  32  dense toolbars and table footers
 *   md  36  the default
 *   lg  44  Apple HIG touch minimum — primary actions and touch-first screens
 *
 * These match `IconButton`'s boxes exactly so the two sit on one row without
 * a half-pixel step.
 */
const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[12.5px] gap-1.5',
  md: 'h-9 px-4 text-[13px] gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
}

/**
 * `primary` is the one solid brand fill. It deliberately uses `--brand-solid`
 * and not `--action`: `--action` is the composer's send button and nothing
 * else (see brand.css §1), and spreading it across every table and dialog
 * button is exactly the "one saturated control per field" rule being broken.
 *
 * `inverse` is for buttons sitting ON a brand fill — the bulk bar, a banner.
 * It exists as a variant rather than a className override because Tailwind
 * resolves conflicting utilities by stylesheet order, not by the order they
 * appear in the attribute: passing `bg-on-brand-solid/16` next to the
 * `secondary` variant's `bg-panel-solid` is a coin toss, and the losing side
 * of it is white text on a white fill.
 *
 * `danger` tints rather than fills. A destructive action wants to be findable,
 * not the loudest thing on the page — the confirmation step is where the
 * weight belongs.
 */
const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-solid text-on-brand-solid hover:bg-brand-fg-hover',
  secondary: 'border border-line bg-panel-solid text-ink hover:bg-tint/6',
  ghost: 'text-ink-soft hover:bg-tint/8 hover:text-ink-strong',
  danger: 'border border-line bg-panel-solid text-danger-fg hover:bg-danger/10',
  inverse:
    'border border-transparent bg-on-brand-solid/16 text-on-brand-solid hover:bg-on-brand-solid/28',
}

/**
 * The text button for the core set.
 *
 * Presentational and uncontrolled: it has no loading state of its own and no
 * `href` form. A button that navigates is an `<a>` styled by the caller —
 * swapping the element under a component that says "button" is how keyboard
 * semantics quietly break.
 *
 * Focus comes from the global `:focus-visible` outline in styles.css, so there
 * is no ring class here; adding one would double the indicator.
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  trailingIcon,
  block = false,
  type = 'button',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const cls = [
    'inline-flex shrink-0 items-center justify-center rounded-lg font-bold whitespace-nowrap transition',
    'disabled:pointer-events-none disabled:opacity-40',
    sizes[size],
    variants[variant],
    block ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={cls} {...rest}>
      {icon && <span className="inline-grid shrink-0 place-items-center">{icon}</span>}
      {children}
      {trailingIcon && (
        <span className="inline-grid shrink-0 place-items-center">{trailingIcon}</span>
      )}
    </button>
  )
}
