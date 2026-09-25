import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'inverse'
export type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Glyph before the label. Sized by the caller, boxed by the button. */
  icon?: ReactNode
  /** Glyph after the label — a chevron on a menu trigger, say. */
  trailingIcon?: ReactNode
  /** Fills its container rather than hugging its label. */
  block?: boolean
  ref?: Ref<HTMLButtonElement>
}
