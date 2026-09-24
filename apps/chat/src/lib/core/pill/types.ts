import type { HTMLAttributes, ReactNode } from 'react'

/**
 * Tones are named for what they mean, never for where they are used. A tone
 * called `active` or `draft` is one domain's vocabulary borrowed into a
 * primitive — the next table along has `settled` and `reconciling`, and the
 * component has to grow a synonym for a colour it already has.
 *
 * There is no `success` / green. brand.css has no green ramp, so a green pill
 * would be the first unthemed colour in the library: it would not follow a
 * `chat-theme-*` switch and would not survive dark mode. `brand` is the
 * resting, healthy state.
 */
export type PillTone = 'brand' | 'neutral' | 'caution' | 'danger'

/**
 * `soft` is a tinted fill, `outline` a hairline on nothing.
 *
 * Use `outline` where pills sit on an already-tinted surface — a selected row,
 * a caution banner — and the soft fills stop separating from it. Both carry a
 * border (transparent on `soft`) so a mixed row keeps one baseline.
 */
export type PillVariant = 'soft' | 'outline'

export type PillProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: PillTone
  variant?: PillVariant
  /** A leading dot, for scanning a dense column. Decoration, not a channel. */
  dot?: boolean
  children: ReactNode
}
