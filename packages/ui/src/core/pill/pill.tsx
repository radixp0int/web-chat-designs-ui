import type { PillProps, PillTone, PillVariant } from './types'

/**
 * `neutral` is built from `--ink-soft`, not from `--tint`.
 *
 * `--tint` is `--brand-600` — the library's single hover/active wash — so a
 * "neutral" pill built on it came out faintly blue and read as a quiet member
 * of the brand family rather than as the absence of state. Ink is the only
 * genuinely neutral thing every theme already declares, and it tracks light
 * and dark for free.
 */
const soft: Record<PillTone, string> = {
  brand: 'border-transparent bg-chip text-chip-fg',
  neutral: 'border-transparent bg-ink-soft/12 text-ink-soft',
  caution: 'border-transparent bg-caution-surface text-caution',
  danger: 'border-transparent bg-danger/12 text-danger-fg',
}

const outline: Record<PillTone, string> = {
  brand: 'border-chip-fg/40 text-chip-fg',
  neutral: 'border-ink-soft/35 text-ink-soft',
  caution: 'border-caution-line text-caution',
  danger: 'border-danger/40 text-danger-fg',
}

const dots: Record<PillTone, string> = {
  brand: 'bg-chip-fg',
  neutral: 'bg-ink-soft',
  caution: 'bg-caution',
  danger: 'bg-danger-fg',
}

const variants: Record<PillVariant, Record<PillTone, string>> = { soft, outline }

/**
 * A small piece of state in a rounded label — a row's status, a tag, a count
 * qualifier.
 *
 * Named `Pill` rather than `StatusPill` because status is one thing it says,
 * not what it is: the same shape carries a plan tier, a region, an environment
 * badge. A name that describes the shape survives the second use case; one
 * that describes the first use case gets a sibling component.
 *
 * Colour never carries the meaning alone — the label is always present, so a
 * pill reads the same to someone who cannot separate the tones. `dot` is there
 * for scanning speed, not as a second channel.
 *
 * Presentational only. A removable pill is `FilterChip`, which owns the button
 * and the aria-label that go with removal.
 */
export function Pill({
  tone = 'neutral',
  variant = 'soft',
  dot = false,
  className = '',
  children,
  ...rest
}: PillProps) {
  const cls = [
    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-bold',
    variants[variant][tone],
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <span className={cls} {...rest}>
      {dot && (
        <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${dots[tone]}`} />
      )}
      {children}
    </span>
  )
}
