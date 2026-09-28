import type { HTMLAttributes, MouseEventHandler, ReactNode } from 'react'

export type AlertTone = 'info' | 'success' | 'warning' | 'error'

export type AlertAction = {
  label: ReactNode
  onClick: MouseEventHandler<HTMLButtonElement>
  ariaLabel?: string
  disabled?: boolean
}

export type AlertProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  tone?: AlertTone
  title: ReactNode
  /** Adds the stronger tone-coloured leading border. Defaults to `false`. */
  bordered?: boolean
  /** Supporting copy beneath the title. */
  children?: ReactNode
  /** Highlighted facts or problems rendered as a semantic list. */
  items?: readonly ReactNode[]
  /** A compact, brand-styled action that remains visually secondary to the message. */
  action?: AlertAction
  /** Present to add a dismiss button. */
  onDismiss?: MouseEventHandler<HTMLButtonElement>
  dismissLabel?: string
  /** Overrides the tone's default glyph; `false` removes it. */
  icon?: ReactNode | false
  /** Arbitrary content disclosed through a native, keyboard-accessible details element. */
  details?: ReactNode
  detailsLabel?: ReactNode
}
